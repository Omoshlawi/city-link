import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Session } from '@thallesp/nestjs-better-auth';
import { ApiErrorsResponse } from '../common/common.decorators';
import { DeleteQueryDto, OriginalUrl } from '../common/query-builder';
import type { UserSession } from '../auth/auth.types';
import {
  QuerySettingsDto,
  QuerySettingsResponseDto,
  SettingResponseDto,
  UpsertSettingDto,
} from './settings.dto';
import { UserSettingsService } from './user-settings.service';

@ApiTags('UserSettings')
@Controller('settings/me')
export class UserSettingsController {
  constructor(private readonly service: UserSettingsService) {}

  @Get('/')
  @ApiOperation({ summary: 'List settings for the authenticated user' })
  @ApiOkResponse({ type: QuerySettingsResponseDto })
  @ApiErrorsResponse()
  getAll(
    @Query() query: QuerySettingsDto,
    @OriginalUrl() originalUrl: string,
    @Session() { user }: UserSession,
  ) {
    return this.service.getAll(user.id, query, originalUrl);
  }

  @Get('/:namespace/:key')
  @ApiOperation({ summary: 'Get a single setting for the authenticated user' })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse()
  getOne(
    @Param('namespace') namespace: string,
    @Param('key') key: string,
    @Session() { user }: UserSession,
  ) {
    return this.service.getOne(user.id, namespace, key);
  }

  @Put('/:namespace/:key')
  @ApiOperation({
    summary: 'Create or update a setting for the authenticated user',
  })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  upsert(
    @Param('namespace') namespace: string,
    @Param('key') key: string,
    @Body() dto: UpsertSettingDto,
    @Session() { user }: UserSession,
  ) {
    return this.service.upsert(user.id, namespace, key, dto);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete own setting (purge=true to hard delete)' })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse()
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
    @Session() { user }: UserSession,
  ) {
    return this.service.delete(user.id, id, query);
  }

  @Post('/:id/restore')
  @ApiOperation({ summary: 'Restore own soft-deleted setting' })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse()
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() { user }: UserSession,
  ) {
    return this.service.restore(user.id, id);
  }
}
