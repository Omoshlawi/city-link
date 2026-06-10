import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushToken } from '../generated/prisma/client';

@Injectable()
export class PushTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    userId: string,
    token: string,
    provider: string,
    platform?: string,
    deviceId?: string,
  ): Promise<PushToken> {
    return this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, provider, platform, deviceId, voided: false },
      update: { userId, provider, platform, deviceId, voided: false },
    });
  }

  async void(id: string, userId: string): Promise<void> {
    const token = await this.prisma.pushToken.findUnique({ where: { id } });
    if (!token) throw new NotFoundException(`Push token '${id}' not found`);
    if (token.userId !== userId) throw new ForbiddenException('Cannot void another user\'s token');
    await this.prisma.pushToken.update({ where: { id }, data: { voided: true } });
  }

  async getActiveByUser(userId: string): Promise<PushToken[]> {
    return this.prisma.pushToken.findMany({
      where: { userId, voided: false },
    });
  }
}
