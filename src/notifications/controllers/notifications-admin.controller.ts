import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiErrorsResponse } from '../../common/common.decorators';
import { OriginalUrl } from '../../common/query-builder';
import { QueryNotificationLogsDto } from '../dto/notifications.dto';
import { NotificationLogService } from '../log.service';

@ApiTags('Admin — Notifications')
@Controller('admin/notifications')
export class NotificationAdminController {
  constructor(private readonly logService: NotificationLogService) {}

  @Get('/logs')
  @UserHasPermission({ permission: { notifications: ['read'] } })
  @ApiOperation({ summary: 'Query notification delivery logs' })
  @ApiErrorsResponse()
  getLogs(
    @Query() query: QueryNotificationLogsDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.logService.queryAdmin(
      {
        provider: query.provider,
        status: query.status,
        templateKey: query.templateKey,
        recipientId: query.recipientId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        page: query.page,
        limit: query.limit,
        orderBy: query.orderBy,
      },
      originalUrl,
    );
  }
}
