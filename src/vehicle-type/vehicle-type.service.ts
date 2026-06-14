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
  CreateVehicleTypeDto,
  QueryVehicleTypeDto,
  UpdateVehicleTypeDto,
} from './vehicle-type.dto';

@Injectable()
export class VehicleTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryVehicleTypeDto, originalUrl: string) {
    const where: Prisma.VehicleTypeWhereInput = {
      AND: [
        { voided: query.includeVoided ? undefined : false },
        {
          OR: query.search
            ? [
                { code: { contains: query.search, mode: 'insensitive' } },
                { name: { contains: query.search, mode: 'insensitive' } },
              ]
            : undefined,
        },
      ],
    };
    const totalCount = await this.prisma.vehicleType.count({ where });
    const data = await this.prisma.vehicleType.findMany({
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
    const vehicleType = await this.prisma.vehicleType.findUnique({
      where: { id },
    });
    if (!vehicleType) throw new NotFoundException('Vehicle type not found');
    return vehicleType;
  }

  create(dto: CreateVehicleTypeDto) {
    return this.prisma.vehicleType.create({ data: dto });
  }

  async update(id: string, dto: UpdateVehicleTypeDto) {
    await this.getOne(id);
    return this.prisma.vehicleType.update({ where: { id }, data: dto });
  }

  async delete(id: string, query: DeleteQueryDto) {
    await this.getOne(id);
    if (query.purge) {
      return this.prisma.vehicleType.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(query.v),
      });
    }
    return this.prisma.vehicleType.update({
      where: { id },
      data: { voided: true },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async restore(id: string, query: CustomRepresentationQueryDto) {
    await this.prisma.vehicleType.findUniqueOrThrow({ where: { id } });
    return this.prisma.vehicleType.update({
      where: { id },
      data: { voided: false },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }
}
