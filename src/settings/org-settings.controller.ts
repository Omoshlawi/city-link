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
import { MemberHasPermission, Session } from '@thallesp/nestjs-better-auth';
import { RequireActiveOrganization } from '../auth/auth.decorators';
import { ApiErrorsResponse } from '../common/common.decorators';
import { DeleteQueryDto, OriginalUrl } from '../common/query-builder';
import type { UserSession } from '../auth/auth.types';
import {
  QuerySettingsDto,
  QuerySettingsResponseDto,
  SettingResponseDto,
  UpsertSettingDto,
} from './settings.dto';
import { OrgSettingsService } from './org-settings.service';

@ApiTags('OrgSettings')
@RequireActiveOrganization()
@Controller('settings/org')
export class OrgSettingsController {
  constructor(private readonly service: OrgSettingsService) {}

  @Get('/')
  @MemberHasPermission({ permissions: { orgSettings: ['view'] } })
  @ApiOperation({ summary: 'List settings for the active organization' })
  @ApiOkResponse({ type: QuerySettingsResponseDto })
  @ApiErrorsResponse()
  getAll(
    @Query() query: QuerySettingsDto,
    @OriginalUrl() originalUrl: string,
    @Session() { session }: UserSession,
  ) {
    return this.service.getAll(
      session.activeOrganizationId!,
      query,
      originalUrl,
    );
  }

  @Get('/:namespace/:key')
  @MemberHasPermission({ permissions: { orgSettings: ['view'] } })
  @ApiOperation({ summary: 'Get a single org setting' })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse()
  getOne(
    @Param('namespace') namespace: string,
    @Param('key') key: string,
    @Session() { session }: UserSession,
  ) {
    return this.service.getOne(session.activeOrganizationId!, namespace, key);
  }

  @Put('/:namespace/:key')
  @MemberHasPermission({ permissions: { orgSettings: ['manage'] } })
  @ApiOperation({ summary: 'Create or update an org setting' })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  upsert(
    @Param('namespace') namespace: string,
    @Param('key') key: string,
    @Body() dto: UpsertSettingDto,
    @Session() { user, session }: UserSession,
  ) {
    return this.service.upsert(
      session.activeOrganizationId!,
      namespace,
      key,
      dto,
      user.id,
    );
  }

  @Delete('/:id')
  @MemberHasPermission({ permissions: { orgSettings: ['manage'] } })
  @ApiOperation({
    summary: 'Delete an org setting (purge=true to hard delete)',
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
  @MemberHasPermission({ permissions: { orgSettings: ['manage'] } })
  @ApiOperation({ summary: 'Restore a soft-deleted org setting' })
  @ApiOkResponse({ type: SettingResponseDto })
  @ApiErrorsResponse()
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.restore(id);
  }
}
