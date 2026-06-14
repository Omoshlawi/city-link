import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetRouteLinksDto } from './route.dto';
import { RouteService } from './route.service';

@Injectable()
export class RouteLinkService {
  constructor(
    private readonly routeService: RouteService,
    private readonly prisma: PrismaService,
  ) {}

  async getRouteLinks(routeId: string) {
    await this.routeService.getOneRoute(routeId);
    return this.prisma.routeLink.findMany({
      where: { routeId },
      orderBy: { order: 'asc' },
    });
  }

  async setRouteLinks(routeId: string, dto: SetRouteLinksDto) {
    await this.routeService.getOneRoute(routeId);
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
}
