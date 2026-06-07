import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CustomRepresentationService,
  PaginationService,
  SortService,
} from '../common/query-builder';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DeleteTemplateDto,
  GetTemplateRepresentationDto,
  QueryOrgOverridesDto,
  QueryOrgOverrideVersionsDto,
  QueryTemplatesDto,
  QueryTemplateVersionsDto,
  UpdateTemplateSlotsDto,
  UpsertOrgOverrideDto,
} from './templates.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  // ── System Templates ────────────────────────────────────────────────────────

  async getAll(query: QueryTemplatesDto, originalUrl: string) {
    const where: Prisma.TemplateWhereInput = {
      AND: [
        {
          voided: query.includeVoided ? undefined : false,
          type: query.type,
        },
        {
          OR: query.search
            ? [
                { key: { contains: query.search, mode: 'insensitive' } },
                { name: { contains: query.search, mode: 'insensitive' } },
                {
                  description: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              ]
            : undefined,
        },
      ],
    };

    const totalCount = await this.prisma.template.count({ where });
    const results = await this.prisma.template.findMany({
      where,
      ...this.paginationService.buildSafePaginationQuery(query, totalCount),
      ...this.sortService.buildSortQuery(query.orderBy),
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });

    return {
      results,
      ...this.paginationService.buildPaginationControls(
        totalCount,
        originalUrl,
        query,
      ),
    };
  }

  async getByKey(key: string, query: GetTemplateRepresentationDto) {
    const template = await this.prisma.template.findUnique({
      where: { key },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
    if (!template) throw new NotFoundException(`Template '${key}' not found`);
    return template;
  }

  async update(key: string, dto: UpdateTemplateSlotsDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.template.findUnique({ where: { key } });
      if (!current) throw new NotFoundException(`Template '${key}' not found`);

      await tx.templateVersion.create({
        data: {
          templateId: current.id,
          version: current.version,
          slots: current.slots as unknown as Prisma.InputJsonValue,
          schema: (current.schema ??
            Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
          metadata: (current.metadata ??
            Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
          changedById: userId ?? null,
          changeNote: dto.changeNote ?? null,
        },
      });

      return tx.template.update({
        where: { key },
        data: {
          slots: dto.slots,
          schema: (dto.schema ??
            Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
          metadata: (dto.metadata ??
            Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
          version: { increment: 1 },
        },
      });
    });
  }

  async delete(key: string, query: DeleteTemplateDto) {
    const exists = await this.prisma.template.findUnique({ where: { key } });
    if (!exists) throw new NotFoundException(`Template '${key}' not found`);

    if (query.purge) {
      return this.prisma.template.delete({
        where: { key },
        ...this.representationService.buildCustomRepresentationQuery(query.v),
      });
    }
    return this.prisma.template.update({
      where: { key },
      data: { voided: true },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async restore(key: string, query: GetTemplateRepresentationDto) {
    const exists = await this.prisma.template.findUnique({ where: { key } });
    if (!exists) throw new NotFoundException(`Template '${key}' not found`);

    return this.prisma.template.update({
      where: { key },
      data: { voided: false },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async getVersions(
    key: string,
    query: QueryTemplateVersionsDto,
    originalUrl: string,
  ) {
    const template = await this.prisma.template.findUnique({ where: { key } });
    if (!template) throw new NotFoundException(`Template '${key}' not found`);

    const where: Prisma.TemplateVersionWhereInput = {
      templateId: template.id,
    };

    const totalCount = await this.prisma.templateVersion.count({ where });
    const results = await this.prisma.templateVersion.findMany({
      where,
      ...this.paginationService.buildSafePaginationQuery(query, totalCount),
      ...this.sortService.buildSortQuery(query.orderBy),
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });

    return {
      results,
      ...this.paginationService.buildPaginationControls(
        totalCount,
        originalUrl,
        query,
      ),
    };
  }

  // ── Org Overrides ───────────────────────────────────────────────────────────

  async getOrgOverrides(
    key: string,
    query: QueryOrgOverridesDto,
    originalUrl: string,
  ) {
    const template = await this.prisma.template.findUnique({ where: { key } });
    if (!template) throw new NotFoundException(`Template '${key}' not found`);

    const where: Prisma.OrgTemplateOverrideWhereInput = {
      templateKey: key,
      organizationId: query.organizationId,
      voided: query.includeVoided ? undefined : false,
    };

    const totalCount = await this.prisma.orgTemplateOverride.count({ where });
    const results = await this.prisma.orgTemplateOverride.findMany({
      where,
      ...this.paginationService.buildSafePaginationQuery(query, totalCount),
      ...this.sortService.buildSortQuery(query.orderBy),
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });

    return {
      results,
      ...this.paginationService.buildPaginationControls(
        totalCount,
        originalUrl,
        query,
      ),
    };
  }

  async getOrgOverride(
    key: string,
    orgId: string,
    query: GetTemplateRepresentationDto,
  ) {
    const override = await this.prisma.orgTemplateOverride.findUnique({
      where: {
        templateKey_organizationId: { templateKey: key, organizationId: orgId },
      },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
    if (!override) {
      throw new NotFoundException(
        `Override for template '${key}' and org '${orgId}' not found`,
      );
    }
    return override;
  }

  async upsertOrgOverride(
    key: string,
    orgId: string,
    dto: UpsertOrgOverrideDto,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.orgTemplateOverride.findUnique({
        where: {
          templateKey_organizationId: {
            templateKey: key,
            organizationId: orgId,
          },
        },
      });

      if (existing) {
        await tx.orgTemplateOverrideVersion.create({
          data: {
            overrideId: existing.id,
            version: existing.version,
            slots: existing.slots as unknown as Prisma.InputJsonValue,
            metadata: (existing.metadata ??
              Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
            changedById: userId ?? null,
            changeNote: dto.changeNote ?? null,
          },
        });

        return tx.orgTemplateOverride.update({
          where: {
            templateKey_organizationId: {
              templateKey: key,
              organizationId: orgId,
            },
          },
          data: {
            slots: dto.slots,
            metadata: (dto.metadata ??
              Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
            version: { increment: 1 },
            voided: false,
          },
        });
      }

      return tx.orgTemplateOverride.create({
        data: {
          templateKey: key,
          organizationId: orgId,
          slots: dto.slots,
          metadata: (dto.metadata ??
            Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
        },
      });
    });
  }

  async deleteOrgOverride(
    key: string,
    orgId: string,
    query: DeleteTemplateDto,
  ) {
    const existing = await this.prisma.orgTemplateOverride.findUnique({
      where: {
        templateKey_organizationId: { templateKey: key, organizationId: orgId },
      },
    });
    if (!existing) {
      throw new NotFoundException(
        `Override for template '${key}' and org '${orgId}' not found`,
      );
    }

    if (query.purge) {
      return this.prisma.orgTemplateOverride.delete({
        where: {
          templateKey_organizationId: {
            templateKey: key,
            organizationId: orgId,
          },
        },
        ...this.representationService.buildCustomRepresentationQuery(query.v),
      });
    }
    return this.prisma.orgTemplateOverride.update({
      where: {
        templateKey_organizationId: { templateKey: key, organizationId: orgId },
      },
      data: { voided: true },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async getOrgOverrideVersions(
    key: string,
    orgId: string,
    query: QueryOrgOverrideVersionsDto,
    originalUrl: string,
  ) {
    const override = await this.prisma.orgTemplateOverride.findUnique({
      where: {
        templateKey_organizationId: { templateKey: key, organizationId: orgId },
      },
    });
    if (!override) {
      throw new NotFoundException(
        `Override for template '${key}' and org '${orgId}' not found`,
      );
    }

    const where: Prisma.OrgTemplateOverrideVersionWhereInput = {
      overrideId: override.id,
    };

    const totalCount = await this.prisma.orgTemplateOverrideVersion.count({
      where,
    });
    const results = await this.prisma.orgTemplateOverrideVersion.findMany({
      where,
      ...this.paginationService.buildSafePaginationQuery(query, totalCount),
      ...this.sortService.buildSortQuery(query.orderBy),
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });

    return {
      results,
      ...this.paginationService.buildPaginationControls(
        totalCount,
        originalUrl,
        query,
      ),
    };
  }
}
