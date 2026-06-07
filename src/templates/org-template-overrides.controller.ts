import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireActiveOrganization } from '../auth/auth.decorators';
import { ApiErrorsResponse } from '../common/common.decorators';
import {
  CustomRepresentationQueryDto,
  DeleteQueryDto,
  OriginalUrl,
} from '../common/query-builder';
import {
  OrgTemplateOverrideResponseDto,
  QueryOrgOverridesDto,
  QueryOrgOverridesResponseDto,
  QueryOrgOverrideVersionsDto,
  QueryOrgOverrideVersionsResponseDto,
  RestoreVersionDto,
  UpsertOrgOverrideDto,
} from './templates.dto';
import { OrgTemplateOverridesService } from './org-template-overrides.service';

@ApiTags('org-template-overrides')
@RequireActiveOrganization()
@Controller('templates')
export class OrgTemplateOverridesController {
  constructor(
    private readonly orgOverridesService: OrgTemplateOverridesService,
  ) {}

  @Get('/:key/overrides')
  @ApiOperation({ summary: 'List org overrides for a template' })
  @ApiOkResponse({ type: QueryOrgOverridesResponseDto })
  @ApiErrorsResponse()
  getOrgOverrides(
    @Param('key') key: string,
    @Query() query: QueryOrgOverridesDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.orgOverridesService.getAll(key, query, originalUrl);
  }

  @Get('/:key/overrides/:orgId')
  @ApiOperation({ summary: "Get an org's override for a template" })
  @ApiOkResponse({ type: OrgTemplateOverrideResponseDto })
  @ApiErrorsResponse()
  getOrgOverride(
    @Param('key') key: string,
    @Param('orgId') orgId: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.orgOverridesService.getOne(key, orgId, query);
  }

  @Put('/:key/overrides/:orgId')
  @ApiOperation({ summary: 'Create or update an org override (upsert)' })
  @ApiOkResponse({ type: OrgTemplateOverrideResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  upsertOrgOverride(
    @Param('key') key: string,
    @Param('orgId') orgId: string,
    @Body() dto: UpsertOrgOverrideDto,
  ) {
    return this.orgOverridesService.upsert(key, orgId, dto);
  }

  @Delete('/:key/overrides/:orgId')
  @ApiOperation({
    summary: 'Soft-delete an org override (purge=true to hard delete)',
  })
  @ApiOkResponse({ type: OrgTemplateOverrideResponseDto })
  @ApiErrorsResponse()
  deleteOrgOverride(
    @Param('key') key: string,
    @Param('orgId') orgId: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.orgOverridesService.delete(key, orgId, query);
  }

  @Get('/:key/overrides/:orgId/versions')
  @ApiOperation({ summary: 'List version history for an org override' })
  @ApiOkResponse({ type: QueryOrgOverrideVersionsResponseDto })
  @ApiErrorsResponse()
  getOrgOverrideVersions(
    @Param('key') key: string,
    @Param('orgId') orgId: string,
    @Query() query: QueryOrgOverrideVersionsDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.orgOverridesService.getVersions(key, orgId, query, originalUrl);
  }

  @Post('/:key/overrides/:orgId/versions/:version/restore')
  @ApiOperation({ summary: 'Restore an org override to a past version' })
  @ApiOkResponse({ type: OrgTemplateOverrideResponseDto })
  @ApiErrorsResponse()
  restoreOrgOverrideToVersion(
    @Param('key') key: string,
    @Param('orgId') orgId: string,
    @Param('version', ParseIntPipe) version: number,
    @Body() dto: RestoreVersionDto,
  ) {
    return this.orgOverridesService.restoreToVersion(key, orgId, version, dto);
  }
}
