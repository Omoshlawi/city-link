import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CustomRepresentationQueryDto,
  CustomRepresentationService,
  DeleteQueryDto,
  PaginationService,
  SortService,
} from '../common/query-builder';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  QueryOrgOverridesDto,
  QueryOrgOverrideVersionsDto,
  RestoreVersionDto,
  UpsertOrgOverrideDto,
} from './templates.dto';

const orgKey = (key: string, orgId: string) => ({
  templateKey_organizationId: { templateKey: key, organizationId: orgId },
});

@Injectable()
export class OrgTemplateOverridesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(key: string, query: QueryOrgOverridesDto, originalUrl: string) {
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

  async getOne(
    key: string,
    orgId: string,
    query: CustomRepresentationQueryDto,
  ) {
    const override = await this.prisma.orgTemplateOverride.findUnique({
      where: orgKey(key, orgId),
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
    if (!override) {
      throw new NotFoundException(
        `Override for template '${key}' and org '${orgId}' not found`,
      );
    }
    return override;
  }

  async upsert(
    key: string,
    orgId: string,
    dto: UpsertOrgOverrideDto,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.orgTemplateOverride.findUnique({
        where: orgKey(key, orgId),
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
          where: orgKey(key, orgId),
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

  async delete(key: string, orgId: string, query: DeleteQueryDto) {
    const existing = await this.prisma.orgTemplateOverride.findUnique({
      where: orgKey(key, orgId),
    });
    if (!existing) {
      throw new NotFoundException(
        `Override for template '${key}' and org '${orgId}' not found`,
      );
    }

    if (query.purge) {
      return this.prisma.orgTemplateOverride.delete({
        where: orgKey(key, orgId),
        ...this.representationService.buildCustomRepresentationQuery(query.v),
      });
    }
    return this.prisma.orgTemplateOverride.update({
      where: orgKey(key, orgId),
      data: { voided: true },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async restoreToVersion(
    key: string,
    orgId: string,
    version: number,
    dto: RestoreVersionDto,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.orgTemplateOverride.findUnique({
        where: orgKey(key, orgId),
      });
      if (!current) {
        throw new NotFoundException(
          `Override for template '${key}' and org '${orgId}' not found`,
        );
      }

      const target = await tx.orgTemplateOverrideVersion.findUnique({
        where: { overrideId_version: { overrideId: current.id, version } },
      });
      if (!target) {
        throw new NotFoundException(
          `Version ${version} of override for template '${key}' and org '${orgId}' not found`,
        );
      }

      await tx.orgTemplateOverrideVersion.create({
        data: {
          overrideId: current.id,
          version: current.version,
          slots: current.slots as unknown as Prisma.InputJsonValue,
          metadata: (current.metadata ??
            Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
          changedById: userId ?? null,
          changeNote: dto.changeNote ?? null,
        },
      });

      return tx.orgTemplateOverride.update({
        where: orgKey(key, orgId),
        data: {
          slots: target.slots as unknown as Prisma.InputJsonValue,
          metadata: (target.metadata ??
            Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
          version: { increment: 1 },
        },
      });
    });
  }

  async getVersions(
    key: string,
    orgId: string,
    query: QueryOrgOverrideVersionsDto,
    originalUrl: string,
  ) {
    const override = await this.prisma.orgTemplateOverride.findUnique({
      where: orgKey(key, orgId),
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
