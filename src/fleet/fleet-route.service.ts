import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaginationService,
  QueryBuilderDto,
  SortService,
} from '../common/query-builder';
import { PrismaService } from '../prisma/prisma.service';
import { FleetLookupService } from './fleet-lookup.service';
import { CreateFleetRouteDto } from './fleet.dto';

@Injectable()
export class FleetRouteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly sortService: SortService,
    private readonly fleetLookup: FleetLookupService,
  ) {}

  async getAll(fleetId: string, operatorId: string, query: QueryBuilderDto, originalUrl: string) {
    await this.fleetLookup.getOneOrFail(fleetId, operatorId);
    const where = { fleetId, voided: false as const };
    const totalCount = await this.prisma.fleetRoute.count({ where });
    const data = await this.prisma.fleetRoute.findMany({
      where,
      include: { route: { select: { id: true, code: true, name: true } } },
      ...this.paginationService.buildSafePaginationQuery(query, totalCount),
      ...this.sortService.buildSortQuery(query.orderBy),
    });
    return {
      results: data,
      ...this.paginationService.buildPaginationControls(totalCount, originalUrl, query),
    };
  }

  async create(fleetId: string, operatorId: string, dto: CreateFleetRouteDto) {
    await this.fleetLookup.getOneOrFail(fleetId, operatorId);
    return this.prisma.fleetRoute.create({
      data: { fleetId, routeId: dto.routeId },
      include: { route: { select: { id: true, code: true, name: true } } },
    });
  }

  async delete(fleetId: string, id: string, operatorId: string) {
    await this.fleetLookup.getOneOrFail(fleetId, operatorId);
    const fleetRoute = await this.prisma.fleetRoute.findUnique({ where: { id } });
    if (!fleetRoute || fleetRoute.fleetId !== fleetId) {
      throw new NotFoundException('Fleet route assignment not found');
    }
    // If this is the currently active route, clear the reference first to avoid FK constraint
    await this.prisma.fleet.updateMany({
      where: { activeFleetRouteId: id },
      data: { activeFleetRouteId: null },
    });
    return this.prisma.fleetRoute.delete({ where: { id } });
  }
}
