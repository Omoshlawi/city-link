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
  CreateServiceClassDto,
  QueryServiceClassDto,
  UpdateServiceClassDto,
} from './service-class.dto';

@Injectable()
export class ServiceClassService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryServiceClassDto, originalUrl: string) {
    const where: Prisma.ServiceClassWhereInput = {
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
    const totalCount = await this.prisma.serviceClass.count({ where });
    const data = await this.prisma.serviceClass.findMany({
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
    const serviceClass = await this.prisma.serviceClass.findUnique({
      where: { id },
    });
    if (!serviceClass) throw new NotFoundException('Service class not found');
    return serviceClass;
  }

  create(dto: CreateServiceClassDto) {
    return this.prisma.serviceClass.create({ data: dto });
  }

  async update(id: string, dto: UpdateServiceClassDto) {
    await this.getOne(id);
    return this.prisma.serviceClass.update({ where: { id }, data: dto });
  }

  async delete(id: string, query: DeleteQueryDto) {
    await this.getOne(id);
    if (query.purge) {
      return this.prisma.serviceClass.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(query.v),
      });
    }
    return this.prisma.serviceClass.update({
      where: { id },
      data: { voided: true },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }

  async restore(id: string, query: CustomRepresentationQueryDto) {
    await this.prisma.serviceClass.findUniqueOrThrow({ where: { id } });
    return this.prisma.serviceClass.update({
      where: { id },
      data: { voided: false },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
  }
}
