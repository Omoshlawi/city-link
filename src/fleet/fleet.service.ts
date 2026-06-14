import { Injectable } from '@nestjs/common';
import {
  CustomRepresentationQueryDto,
  CustomRepresentationService,
  DeleteQueryDto,
  PaginationService,
  SortService,
} from '../common/query-builder';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FleetLookupService } from './fleet-lookup.service';
import {
  CreateFleetDto,
  QueryFleetDto,
  UpdateFleetDto,
} from './fleet.dto';

@Injectable()
export class FleetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
    private readonly fleetLookup: FleetLookupService,
  ) {}

  async getAll(operatorId: string, query: QueryFleetDto, originalUrl: string) {
    const where: Prisma.FleetWhereInput = {
      AND: [
        { operatorId },
        { voided: query.includeVoided ? undefined : false },
        query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { plateNumber: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {},
        query.status ? { status: query.status } : {},
        query.vehicleTypeId ? { vehicleTypeId: query.vehicleTypeId } : {},
      ],
    };
    const totalCount = await this.prisma.fleet.count({ where });
    const data = await this.prisma.fleet.findMany({
      where,
      include: { vehicleType: { select: { id: true, code: true, name: true } } },
      ...this.paginationService.buildSafePaginationQuery(query, totalCount),
      ...this.sortService.buildSortQuery(query.orderBy),
    });
    return {
      results: data,
      ...this.paginationService.buildPaginationControls(totalCount, originalUrl, query),
    };
  }

  getOne(id: string, operatorId: string) {
    return this.fleetLookup.getOneOrFail(id, operatorId);
  }

  create(operatorId: string, dto: CreateFleetDto) {
    return this.prisma.fleet.create({
      data: { ...dto, operatorId },
      include: { vehicleType: { select: { id: true, code: true, name: true } } },
    });
  }

  async update(
    id: string,
    operatorId: string,
    dto: UpdateFleetDto,
    query?: CustomRepresentationQueryDto,
  ) {
    await this.fleetLookup.getOneOrFail(id, operatorId);
    return this.prisma.fleet.update({
      where: { id },
      data: dto,
      include: { vehicleType: { select: { id: true, code: true, name: true } } },
      ...this.representationService.buildCustomRepresentationQuery(query?.v),
    });
  }

  async delete(id: string, operatorId: string, query: DeleteQueryDto) {
    await this.fleetLookup.getOneOrFail(id, operatorId);
    if (query.purge) {
      return this.prisma.fleet.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(query.v),
      });
    }
    return this.prisma.fleet.update({
      where: { id },
      data: { voided: true },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async restore(id: string, operatorId: string, query: CustomRepresentationQueryDto) {
    await this.fleetLookup.getOneOrFail(id, operatorId);
    return this.prisma.fleet.update({
      where: { id },
      data: { voided: false },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }
}
