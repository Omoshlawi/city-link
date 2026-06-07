import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import Handlebars from 'handlebars';
import { TemplateEngine } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

export interface RenderedTemplate {
  slots: Record<string, string>;
  metadata: Record<string, unknown> | null;
}

@Injectable()
export class TemplateRendererService implements OnModuleInit {
  private readonly logger = new Logger(TemplateRendererService.name);
  private hbs!: ReturnType<typeof Handlebars.create>;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.hbs = Handlebars.create();
    this.registerHelpers();
    const names = Object.keys(this.hbs.helpers).join(', ');
    this.logger.log(`Registered Handlebars helpers: ${names}`);
  }

  async render(
    key: string,
    data: Record<string, unknown>,
    orgId?: string,
  ): Promise<RenderedTemplate> {
    const template = await this.prisma.template.findUnique({ where: { key } });
    if (!template) throw new NotFoundException(`Template '${key}' not found`);

    const override = orgId
      ? await this.prisma.orgTemplateOverride.findUnique({
          where: {
            templateKey_organizationId: {
              templateKey: key,
              organizationId: orgId,
            },
          },
        })
      : null;

    const systemSlots = template.slots as unknown as Record<string, string>;
    const orgSlots = override
      ? (override.slots as unknown as Record<string, string>)
      : {};
    const mergedSlots = { ...systemSlots, ...orgSlots };

    const systemMeta = template.metadata as unknown as Record<
      string,
      unknown
    > | null;
    const orgMeta = override
      ? (override.metadata as unknown as Record<string, unknown> | null)
      : null;
    const mergedMeta =
      systemMeta || orgMeta
        ? { ...(systemMeta ?? {}), ...(orgMeta ?? {}) }
        : null;

    const rendered = this.compileSlots(template.engine, mergedSlots, data);

    return { slots: rendered, metadata: mergedMeta };
  }

  private compileSlots(
    engine: TemplateEngine,
    slots: Record<string, string>,
    data: Record<string, unknown>,
  ): Record<string, string> {
    switch (engine) {
      case TemplateEngine.HANDLEBARS:
        return this.renderHandlebars(slots, data);
      default:
        throw new InternalServerErrorException(
          `Unsupported template engine: ${String(engine)}`,
        );
    }
  }

  private renderHandlebars(
    slots: Record<string, string>,
    data: Record<string, unknown>,
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(slots).map(([name, source]) => [
        name,
        this.hbs.compile(source)(data),
      ]),
    );
  }

  // Handlebars always appends an options hash as the final argument; helpers
  // that don't need it should still accept and ignore it to avoid misreading
  // the hash as a real parameter when the caller omits optional args.
  private registerHelpers() {
    // ── Date / time ───────────────────────────────────────────────────────────
    this.hbs.registerHelper(
      'formatDate',
      (value: unknown, locale?: unknown) => {
        const date = value instanceof Date ? value : new Date(String(value));
        if (isNaN(date.getTime())) return String(value);
        // Handlebars passes its options hash as the last arg; treat non-string
        // locale values (the hash object) as "use default".
        const loc = typeof locale === 'string' ? locale : 'en-GB';
        return new Intl.DateTimeFormat(loc, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(date);
      },
    );

    this.hbs.registerHelper('year', () => new Date().getFullYear());

    // ── String ────────────────────────────────────────────────────────────────
    this.hbs.registerHelper('uppercase', (value: unknown) =>
      this.str(value).toUpperCase(),
    );

    this.hbs.registerHelper('lowercase', (value: unknown) =>
      this.str(value).toLowerCase(),
    );

    this.hbs.registerHelper('capitalize', (value: unknown) => {
      const s = this.str(value);
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    });

    // ── Logic (for use inside {{#if (eq ...)}} sub-expressions) ───────────────
    this.hbs.registerHelper('eq', (a: unknown, b: unknown) => a === b);

    this.hbs.registerHelper('neq', (a: unknown, b: unknown) => a !== b);

    // ── Fallback ──────────────────────────────────────────────────────────────
    this.hbs.registerHelper(
      'default',
      (value: unknown, fallback: unknown) => value ?? fallback,
    );
  }

  private str(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean')
      return String(value);
    return '';
  }
}
