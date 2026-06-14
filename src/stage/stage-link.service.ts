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
  CreateStageLinkDto,
  QueryStageLinkDto,
  UpdateStageLinkDto,
} from './stage.dto';
import { StageService } from './stage.service';

@Injectable()
export class StageLinkService {
  constructor(
    private readonly stageService: StageService,
    private readonly prisma: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAllLinks(
    fromStageId: string,
    query: QueryStageLinkDto,
    originalUrl: string,
  ) {
    await this.stageService.getOne(fromStageId);

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
          fromStageId: direction === 'incoming' ? query.fromStageId : undefined,
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
    await this.stageService.getOne(fromStageId);
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
