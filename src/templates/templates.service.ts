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
  QueryTemplatesDto,
  QueryTemplateVersionsDto,
  RestoreVersionDto,
  UpdateTemplateSlotsDto,
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

  async getByKey(key: string, query: CustomRepresentationQueryDto) {
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

  async delete(key: string, query: DeleteQueryDto) {
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

  async restore(key: string, query: CustomRepresentationQueryDto) {
    const exists = await this.prisma.template.findUnique({ where: { key } });
    if (!exists) throw new NotFoundException(`Template '${key}' not found`);

    return this.prisma.template.update({
      where: { key },
      data: { voided: false },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async restoreToVersion(
    key: string,
    version: number,
    dto: RestoreVersionDto,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.template.findUnique({ where: { key } });
      if (!current) throw new NotFoundException(`Template '${key}' not found`);

      const target = await tx.templateVersion.findUnique({
        where: { templateId_version: { templateId: current.id, version } },
      });
      if (!target) {
        throw new NotFoundException(
          `Version ${version} of template '${key}' not found`,
        );
      }

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
          slots: target.slots as unknown as Prisma.InputJsonValue,
          schema: (target.schema ??
            Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
          metadata: (target.metadata ??
            Prisma.DbNull) as unknown as Prisma.NullableJsonNullValueInput,
          version: { increment: 1 },
        },
      });
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
}
