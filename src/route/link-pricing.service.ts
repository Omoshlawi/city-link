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
  CreateLinkPricingDto,
  QueryLinkPricingDto,
  UpdateLinkPricingDto,
} from './route.dto';
import { RouteService } from './route.service';

@Injectable()
export class LinkPricingService {
  constructor(
    private readonly routeService: RouteService,
    private readonly prisma: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAllPricing(
    routeId: string,
    operatorId: string,
    query: QueryLinkPricingDto,
    originalUrl: string,
  ) {
    await this.routeService.getOneRoute(routeId);
    const where: Prisma.LinkPricingWhereInput = {
      AND: [
        {
          routeId,
          operatorId,
          voided: query.includeVoided ? undefined : false,
          stageLinkId: query.stageLinkId,
          day: query.day,
        },
      ],
    };
    const totalCount = await this.prisma.linkPricing.count({ where });
    const data = await this.prisma.linkPricing.findMany({
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

  createPricing(
    routeId: string,
    operatorId: string,
    dto: CreateLinkPricingDto,
  ) {
    return this.prisma.linkPricing.create({
      data: { ...dto, routeId: dto.routeId ?? routeId, operatorId },
    });
  }

  async updatePricing(
    pricingId: string,
    operatorId: string,
    dto: UpdateLinkPricingDto,
  ) {
    const existing = await this.prisma.linkPricing.findUnique({
      where: { id: pricingId },
    });
    if (!existing || existing.operatorId !== operatorId) {
      throw new NotFoundException('Pricing record not found');
    }
    return this.prisma.linkPricing.update({
      where: { id: pricingId },
      data: dto,
    });
  }

  async deletePricing(
    pricingId: string,
    operatorId: string,
    query: DeleteQueryDto,
  ) {
    const existing = await this.prisma.linkPricing.findUnique({
      where: { id: pricingId },
    });
    if (!existing || existing.operatorId !== operatorId) {
      throw new NotFoundException('Pricing record not found');
    }
    if (query.purge) {
      return this.prisma.linkPricing.delete({
        where: { id: pricingId },
        ...this.representationService.buildCustomRepresentationQuery(query.v),
      });
    }
    return this.prisma.linkPricing.update({
      where: { id: pricingId },
      data: { voided: true },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async restorePricing(
    pricingId: string,
    operatorId: string,
    query: CustomRepresentationQueryDto,
  ) {
    const existing = await this.prisma.linkPricing.findUnique({
      where: { id: pricingId },
    });
    if (!existing || existing.operatorId !== operatorId) {
      throw new NotFoundException('Pricing record not found');
    }
    return this.prisma.linkPricing.update({
      where: { id: pricingId },
      data: { voided: false },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }
}
