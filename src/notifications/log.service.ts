import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationLog,
} from '../generated/prisma/client';
import { PaginationService, SortService } from '../common/query-builder';

export interface WriteLogDto {
  dispatchId: string;
  templateKey: string;
  channel: NotificationChannel;
  provider: string;
  status: NotificationStatus;
  attemptNumber: number;
  recipientRef: string;
  recipientId?: string;
  organizationId?: string;
  subject?: string;
  body?: string;
  jobId?: string;
  error?: string;
  providerMeta?: Record<string, unknown>;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
}

export interface AdminLogQueryDto {
  provider?: string;
  status?: NotificationStatus;
  templateKey?: string;
  recipientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  orderBy?: string;
}

@Injectable()
export class NotificationLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly sortService: SortService,
  ) {}

  async write(dto: WriteLogDto): Promise<NotificationLog> {
    return this.prisma.notificationLog.create({
      data: {
        dispatchId: dto.dispatchId,
        templateKey: dto.templateKey,
        channel: dto.channel,
        provider: dto.provider,
        status: dto.status,
        attemptNumber: dto.attemptNumber,
        recipientRef: dto.recipientRef,
        recipientId: dto.recipientId,
        organizationId: dto.organizationId,
        subject: dto.subject,
        body: dto.body,
        jobId: dto.jobId,
        error: dto.error,
        providerMeta: dto.providerMeta as Prisma.InputJsonValue | undefined,
        sentAt: dto.sentAt,
        deliveredAt: dto.deliveredAt,
        failedAt: dto.failedAt,
      },
    });
  }

  async queryAdmin(filters: AdminLogQueryDto, originalUrl: string) {
    const where = {
      ...(filters.provider && { provider: filters.provider }),
      ...(filters.status && { status: filters.status }),
      ...(filters.templateKey && { templateKey: filters.templateKey }),
      ...(filters.recipientId && { recipientId: filters.recipientId }),
      ...((filters.dateFrom || filters.dateTo) && {
        createdAt: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      }),
    };

    const totalCount = await this.prisma.notificationLog.count({ where });
    const results = await this.prisma.notificationLog.findMany({
      where,
      ...this.paginationService.buildSafePaginationQuery(filters, totalCount),
      ...this.sortService.buildSortQuery(filters.orderBy),
    });

    return {
      results,
      ...this.paginationService.buildPaginationControls(totalCount, originalUrl, filters),
    };
  }
}
