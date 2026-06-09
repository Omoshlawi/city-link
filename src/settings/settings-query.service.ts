import { Injectable } from '@nestjs/common';
import { Prisma, SettingScope, SettingType } from '../generated/prisma/client';
import {
  CustomRepresentationService,
  PaginationService,
  SortService,
} from '../common/query-builder';
import { PrismaService } from '../prisma/prisma.service';
import { QuerySettingsDto } from './settings.dto';

interface OwnerArgs {
  scope: SettingScope;
  userId?: string;
  organizationId?: string;
}

interface KeyArgs extends OwnerArgs {
  namespace: string;
  key: string;
}

interface UpsertArgs extends KeyArgs {
  value: string;
  valueType?: SettingType;
  description?: string;
  isPublic?: boolean;
  updatedBy?: string;
}

@Injectable()
export class SettingsQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sort: SortService,
    private readonly pagination: PaginationService,
    private readonly representation: CustomRepresentationService,
  ) {}

  async findMany(
    owner: OwnerArgs,
    query: QuerySettingsDto,
    originalUrl: string,
  ) {
    const where = this.buildWhere(owner, query);
    const totalCount = await this.prisma.setting.count({ where });
    const data = await this.prisma.setting.findMany({
      where,
      ...this.pagination.buildSafePaginationQuery(query, totalCount),
      ...this.sort.buildSortQuery(query?.orderBy),
      ...this.representation.buildCustomRepresentationQuery(query?.v),
    });
    return {
      results: data,
      ...this.pagination.buildPaginationControls(
        totalCount,
        originalUrl,
        query,
      ),
    };
  }

  async findOne(args: KeyArgs) {
    return this.prisma.setting.findFirst({
      where: {
        scope: args.scope,
        namespace: args.namespace,
        key: args.key,
        userId: args.userId ?? null,
        organizationId: args.organizationId ?? null,
        deletedAt: null,
      },
    });
  }

  async upsert(args: UpsertArgs) {
    const identity = {
      scope: args.scope,
      namespace: args.namespace,
      key: args.key,
      userId: args.userId ?? null,
      organizationId: args.organizationId ?? null,
    };

    // Prisma compound unique lookups don't accept nulls, so we find first then branch.
    const existing = await this.prisma.setting.findFirst({
      where: identity,
      select: { id: true },
    });

    if (existing) {
      return this.prisma.setting.update({
        where: { id: existing.id },
        data: {
          value: args.value,
          valueType: args.valueType ?? SettingType.STRING,
          description: args.description,
          isPublic: args.isPublic,
          updatedBy: args.updatedBy,
          deletedAt: null,
        },
      });
    }

    return this.prisma.setting.create({
      data: {
        ...identity,
        value: args.value,
        valueType: args.valueType ?? SettingType.STRING,
        description: args.description,
        isPublic: args.isPublic ?? false,
        updatedBy: args.updatedBy,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.setting.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string) {
    return this.prisma.setting.delete({ where: { id } });
  }

  async restore(id: string) {
    return this.prisma.setting.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async getRawValue(args: KeyArgs): Promise<string | null> {
    const record = await this.prisma.setting.findFirst({
      where: {
        scope: args.scope,
        namespace: args.namespace,
        key: args.key,
        userId: args.userId ?? null,
        organizationId: args.organizationId ?? null,
        deletedAt: null,
      },
      select: { value: true },
    });
    return record?.value ?? null;
  }

  async getNamespaceValues(
    owner: OwnerArgs,
    namespace: string,
  ): Promise<Record<string, string>> {
    const records = await this.prisma.setting.findMany({
      where: {
        scope: owner.scope,
        namespace,
        userId: owner.userId ?? null,
        organizationId: owner.organizationId ?? null,
        deletedAt: null,
      },
      select: { key: true, value: true },
    });
    return Object.fromEntries(records.map((r) => [r.key, r.value]));
  }

  private buildWhere(
    owner: OwnerArgs,
    query: QuerySettingsDto,
  ): Prisma.SettingWhereInput {
    return {
      scope: owner.scope,
      userId: owner.userId ?? null,
      organizationId: owner.organizationId ?? null,
      deletedAt: query.includeDeleted ? undefined : null,
      namespace: query.namespace,
      key: query.key,
      valueType: query.valueType,
      ...(query.search
        ? {
            OR: [
              { namespace: { contains: query.search, mode: 'insensitive' } },
              { key: { contains: query.search, mode: 'insensitive' } },
              { value: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }
}
