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
import { Session, UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiErrorsResponse } from '../common/common.decorators';
import { DeleteQueryDto, OriginalUrl } from '../common/query-builder';
import type { UserSession } from '../auth/auth.types';
import {
  QuerySettingsDto,
  QuerySettingsResponseDto,
  SettingResponseDto,
  UpsertSettingDto,
} from './settings.dto';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('SystemSettings')
@Controller('settings/system')
export class SystemSettingsController {
  constructor(private readonly service: SystemSettingsService) {}

  @Get('/')
  @UserHasPermission({ permission: { setting: ['view'] } })
  @ApiOperation({ summary: 'List system settings' })
  @ApiOkResponse({ type: QuerySettingsResponseDto })
  @ApiErrorsResponse()
  getAll(@Query() query: QuerySettingsDto, @OriginalUrl() originalUrl: string) {
    return this.service.getAll(query, originalUrl);
  }

  @Get('/:namespace/:key')
  @UserHasPermission({ permission: { setting: ['view'] } })
  @ApiOperation({ summary: 'Get a single system setting' })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse()
  getOne(@Param('namespace') namespace: string, @Param('key') key: string) {
    return this.service.getOne(namespace, key);
  }

  @Put('/:namespace/:key')
  @UserHasPermission({ permission: { setting: ['manage-system'] } })
  @ApiOperation({ summary: 'Create or update a system setting' })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  upsert(
    @Param('namespace') namespace: string,
    @Param('key') key: string,
    @Body() dto: UpsertSettingDto,
    @Session() { user }: UserSession,
  ) {
    return this.service.upsert(namespace, key, dto, user.id);
  }

  @Delete('/:id')
  @UserHasPermission({ permission: { setting: ['manage-system'] } })
  @ApiOperation({
    summary: 'Delete a system setting (purge=true to hard delete)',
  })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse()
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.service.delete(id, query);
  }

  @Post('/:id/restore')
  @UserHasPermission({ permission: { setting: ['manage-system'] } })
  @ApiOperation({ summary: 'Restore a soft-deleted system setting' })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse()
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.restore(id);
  }
}
