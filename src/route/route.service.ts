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
  CreateRouteDto,
  QueryLinkPricingDto,
  QueryRouteDto,
  SetRouteLinksDto,
  UpdateLinkPricingDto,
  UpdateRouteDto,
} from './route.dto';

@Injectable()
export class RouteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  // ─── Route ────────────────────────────────────────────────────────────────

  async getAllRoutes(query: QueryRouteDto, originalUrl: string) {
    const where: Prisma.RouteWhereInput = {
      AND: [
        {
          voided: query.includeVoided ? undefined : false,
          code: query.code,
          name: query.name,
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
    const totalCount = await this.prisma.route.count({ where });
    const data = await this.prisma.route.findMany({
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

  async getOneRoute(id: string) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  createRoute(dto: CreateRouteDto) {
    return this.prisma.route.create({ data: dto });
  }

  async updateRoute(id: string, dto: UpdateRouteDto) {
    await this.getOneRoute(id);
    return this.prisma.route.update({ where: { id }, data: dto });
  }

  async deleteRoute(id: string, query: DeleteQueryDto) {
    await this.getOneRoute(id);
    if (query.purge) {
      return this.prisma.route.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(query.v),
      });
    }
    return this.prisma.route.update({
      where: { id },
      data: { voided: true },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async restoreRoute(id: string, query: CustomRepresentationQueryDto) {
    await this.prisma.route.findUniqueOrThrow({ where: { id } });
    return this.prisma.route.update({
      where: { id },
      data: { voided: false },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  // ─── RouteLink ────────────────────────────────────────────────────────────

  async getRouteLinks(routeId: string) {
    await this.getOneRoute(routeId);
    return this.prisma.routeLink.findMany({
      where: { routeId },
      orderBy: { order: 'asc' },
    });
  }

  async setRouteLinks(routeId: string, dto: SetRouteLinksDto) {
    await this.getOneRoute(routeId);
    return this.prisma.$transaction(async (tx) => {
      await tx.routeLink.deleteMany({ where: { routeId } });
      await tx.routeLink.createMany({
        data: dto.links.map(({ stageLinkId, order }) => ({
          routeId,
          stageLinkId,
          order,
        })),
      });
      return tx.routeLink.findMany({
        where: { routeId },
        orderBy: { order: 'asc' },
      });
    });
  }

  // ─── LinkPricing ──────────────────────────────────────────────────────────

  async getAllPricing(
    routeId: string,
    operatorId: string,
    query: QueryLinkPricingDto,
    originalUrl: string,
  ) {
    await this.getOneRoute(routeId);
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
