import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session } from '@thallesp/nestjs-better-auth';
import { ApiErrorsResponse } from '../../common/common.decorators';
import { OriginalUrl } from '../../common/query-builder';
import type { UserSession } from '../../auth/auth.types';
import { QueryInboxDto } from '../dto/notifications.dto';
import { NotificationInboxService } from '../inbox.service';

@ApiTags('Notifications')
@Controller('notifications/inbox')
export class InboxController {
  constructor(private readonly inboxService: NotificationInboxService) {}

  @Get('/')
  @ApiOperation({ summary: 'List notifications in the authenticated user\'s inbox' })
  @ApiErrorsResponse()
  findAll(
    @Query() query: QueryInboxDto,
    @OriginalUrl() originalUrl: string,
    @Session() { user }: UserSession,
  ) {
    return this.inboxService.findByUser(user.id, query, originalUrl);
  }

  @Patch('/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiErrorsResponse()
  markRead(@Param('id', ParseUUIDPipe) id: string, @Session() { user }: UserSession) {
    return this.inboxService.markRead(id, user.id);
  }

  @Patch('/read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiErrorsResponse()
  markAllRead(@Session() { user }: UserSession) {
    return this.inboxService.markAllRead(user.id);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification from the inbox' })
  @ApiErrorsResponse()
  remove(@Param('id', ParseUUIDPipe) id: string, @Session() { user }: UserSession) {
    return this.inboxService.remove(id, user.id);
  }
}
