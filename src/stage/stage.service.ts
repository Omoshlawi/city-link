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
  CreateStageDto,
  CreateStageLinkDto,
  QueryStageDto,
  QueryStageLinkDto,
  UpdateStageDto,
  UpdateStageLinkDto,
} from './stage.dto';

@Injectable()
export class StageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  // ─── Stage ────────────────────────────────────────────────────────────────

  async getAll(query: QueryStageDto, originalUrl: string) {
    const where: Prisma.StageWhereInput = {
      AND: [
        {
          voided: query.includeVoided ? undefined : false,
          areaId: query.areaId,
          code: query.code,
        },
        {
          OR: query.search
            ? [
                { name: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } },
              ]
            : undefined,
        },
      ],
    };
    const totalCount = await this.prisma.stage.count({ where });
    const data = await this.prisma.stage.findMany({
      where,
      ...this.paginationService.buildSafePaginationQuery(query, totalCount),
      ...this.representationService.buildCustomRepresentationQuery(query.v),
      ...this.sortService.buildSortQuery(query.orderBy),
    });
    return {
      results: data,
      ...this.paginationService.buildPaginationControls(
        totalCount,
        originalUrl,
        query,
      ),
    };
  }

  async getOne(id: string) {
    const stage = await this.prisma.stage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException('Stage not found');
    return stage;
  }

  create(dto: CreateStageDto) {
    return this.prisma.stage.create({ data: dto });
  }

  async update(id: string, dto: UpdateStageDto) {
    await this.getOne(id);
    return this.prisma.stage.update({ where: { id }, data: dto });
  }

  async delete(id: string, query: DeleteQueryDto) {
    await this.getOne(id);
    if (query.purge) {
      return this.prisma.stage.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(query.v),
      });
    }
    return this.prisma.stage.update({
      where: { id },
      data: { voided: true },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async restore(id: string, query: CustomRepresentationQueryDto) {
    await this.prisma.stage.findUniqueOrThrow({ where: { id } });
    return this.prisma.stage.update({
      where: { id },
      data: { voided: false },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  // ─── StageLink ────────────────────────────────────────────────────────────

  async getAllLinks(
    fromStageId: string,
    query: QueryStageLinkDto,
    originalUrl: string,
  ) {
    await this.getOne(fromStageId);

    const direction = query.direction ?? 'outgoing';
    let dirFilter: Prisma.StageLinkWhereInput;
    if (direction === 'incoming') {
      dirFilter = { toStageId: fromStageId };
    } else if (direction === 'both') {
      dirFilter = { OR: [{ fromStageId }, { toStageId: fromStageId }] };
    } else {
      dirFilter = { fromStageId };
    }

    const where: Prisma.StageLinkWhereInput = {
      AND: [
        dirFilter,
        {
          voided: query.includeVoided ? undefined : false,
          toStageId: direction === 'outgoing' ? query.toStageId : undefined,
        },
      ],
    };

    const totalCount = await this.prisma.stageLink.count({ where });
    const data = await this.prisma.stageLink.findMany({
      where,
      ...this.paginationService.buildSafePaginationQuery(query, totalCount),
      ...this.representationService.buildCustomRepresentationQuery(query.v),
      ...this.sortService.buildSortQuery(query.orderBy),
    });
    return {
      results: data,
      ...this.paginationService.buildPaginationControls(
        totalCount,
        originalUrl,
        query,
      ),
    };
  }

  async getOneLink(fromStageId: string, linkId: string) {
    const link = await this.prisma.stageLink.findFirst({
      where: { id: linkId, fromStageId },
    });
    if (!link) throw new NotFoundException('Stage link not found');
    return link;
  }

  async createLink(fromStageId: string, dto: CreateStageLinkDto) {
    await this.getOne(fromStageId);
    return this.prisma.stageLink.create({
      data: { fromStageId, ...dto },
    });
  }

  async updateLink(
    fromStageId: string,
    linkId: string,
    dto: UpdateStageLinkDto,
  ) {
    await this.getOneLink(fromStageId, linkId);
    return this.prisma.stageLink.update({ where: { id: linkId }, data: dto });
  }

  async deleteLink(fromStageId: string, linkId: string, query: DeleteQueryDto) {
    await this.getOneLink(fromStageId, linkId);
    if (query.purge) {
      return this.prisma.stageLink.delete({
        where: { id: linkId },
        ...this.representationService.buildCustomRepresentationQuery(query.v),
      });
    }
    return this.prisma.stageLink.update({
      where: { id: linkId },
      data: { voided: true },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async restoreLink(
    fromStageId: string,
    linkId: string,
    query: CustomRepresentationQueryDto,
  ) {
    await this.prisma.stageLink.findFirstOrThrow({
      where: { id: linkId, fromStageId },
    });
    return this.prisma.stageLink.update({
      where: { id: linkId },
      data: { voided: false },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }
}
