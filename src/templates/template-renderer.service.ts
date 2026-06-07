import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import Handlebars from 'handlebars';
import { TemplateEngine } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

export interface RenderedTemplate {
  slots: Record<string, string>;
  metadata: Record<string, unknown> | null;
}

@Injectable()
export class TemplateRendererService {
  constructor(private readonly prisma: PrismaService) {}

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
        Handlebars.compile(source)(data),
      ]),
    );
  }
}
