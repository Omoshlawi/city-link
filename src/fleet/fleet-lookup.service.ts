import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FleetLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async getOneOrFail(id: string, operatorId: string) {
    const fleet = await this.prisma.fleet.findUnique({ where: { id } });
    if (!fleet) throw new NotFoundException('Vehicle not found');
    if (fleet.operatorId !== operatorId) throw new ForbiddenException('Vehicle not found');
    return fleet;
  }
}
