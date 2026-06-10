import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationInbox } from '../generated/prisma/client';
import { PaginationService, SortService } from '../common/query-builder';

export interface CreateInboxDto {
  dispatchId: string;
  userId: string;
  organizationId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  templateKey?: string;
  internalNote: string;
  visible?: boolean;
}

export interface QueryInboxDto {
  read?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
}

@Injectable()
export class NotificationInboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly sortService: SortService,
  ) {}

  async create(dto: CreateInboxDto): Promise<NotificationInbox> {
    return this.prisma.notificationInbox.create({
      data: {
        dispatchId: dto.dispatchId,
        userId: dto.userId,
        organizationId: dto.organizationId,
        title: dto.title,
        body: dto.body,
        data: (dto.data ?? undefined) as Prisma.InputJsonValue | undefined,
        templateKey: dto.templateKey,
        internalNote: dto.internalNote,
        visible: dto.visible ?? true,
      },
    });
  }

  async findByUser(userId: string, query: QueryInboxDto, originalUrl: string) {
    const where = {
      userId,
      visible: true,
      ...(query.read !== undefined && { read: query.read }),
    };

    const totalCount = await this.prisma.notificationInbox.count({ where });
    const results = await this.prisma.notificationInbox.findMany({
      where,
      ...this.paginationService.buildSafePaginationQuery(query, totalCount),
      ...this.sortService.buildSortQuery(query.orderBy ?? '-createdAt'),
    });

    return {
      results,
      ...this.paginationService.buildPaginationControls(totalCount, originalUrl, query),
    };
  }

  async markRead(id: string, userId: string): Promise<void> {
    const entry = await this.prisma.notificationInbox.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException(`Notification '${id}' not found`);
    if (entry.userId !== userId) throw new ForbiddenException('Cannot update another user\'s notification');
    await this.prisma.notificationInbox.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notificationInbox.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const entry = await this.prisma.notificationInbox.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException(`Notification '${id}' not found`);
    if (entry.userId !== userId) throw new ForbiddenException('Cannot delete another user\'s notification');
    await this.prisma.notificationInbox.delete({ where: { id } });
  }
}
