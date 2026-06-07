import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
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
  QueryTemplatesDto,
  QueryTemplatesResponseDto,
  QueryTemplateVersionsDto,
  QueryTemplateVersionsResponseDto,
  TemplateResponseDto,
  UpdateTemplateSlotsDto,
  UpsertOrgOverrideDto,
} from './templates.dto';
import { OrgTemplateOverridesService } from './org-template-overrides.service';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly orgOverridesService: OrgTemplateOverridesService,
  ) {}

  // ── System Templates ────────────────────────────────────────────────────────

  @Get('/')
  @ApiOperation({ summary: 'List templates' })
  @ApiOkResponse({ type: QueryTemplatesResponseDto })
  @ApiErrorsResponse()
  queryTemplates(
    @Query() query: QueryTemplatesDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.templatesService.getAll(query, originalUrl);
  }

  @Get('/:key')
  @ApiOperation({ summary: 'Get a template by key' })
  @ApiOkResponse({ type: TemplateResponseDto })
  @ApiErrorsResponse()
  getTemplate(
    @Param('key') key: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.templatesService.getByKey(key, query);
  }

  @Patch('/:key')
  // @RequireSystemPermission({ templates: ['update'] })
  @ApiOperation({
    summary: 'Update template slots (creates a version snapshot)',
  })
  @ApiOkResponse({ type: TemplateResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateTemplate(
    @Param('key') key: string,
    @Body() dto: UpdateTemplateSlotsDto,
  ) {
    return this.templatesService.update(key, dto);
  }

  @Delete('/:key')
  // @RequireSystemPermission({ templates: ['delete'] })
  @ApiOperation({
    summary: 'Soft-delete a template (purge=true to hard delete)',
  })
  @ApiOkResponse({ type: TemplateResponseDto })
  @ApiErrorsResponse()
  deleteTemplate(@Param('key') key: string, @Query() query: DeleteQueryDto) {
    return this.templatesService.delete(key, query);
  }

  @Post('/:key/restore')
  // @RequireSystemPermission({ templates: ['update'] })
  @ApiOperation({ summary: 'Restore a voided template' })
  @ApiOkResponse({ type: TemplateResponseDto })
  @ApiErrorsResponse()
  restoreTemplate(
    @Param('key') key: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.templatesService.restore(key, query);
  }

  @Get('/:key/versions')
  @ApiOperation({ summary: 'List version history for a template' })
  @ApiOkResponse({ type: QueryTemplateVersionsResponseDto })
  @ApiErrorsResponse()
  getTemplateVersions(
    @Param('key') key: string,
    @Query() query: QueryTemplateVersionsDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.templatesService.getVersions(key, query, originalUrl);
  }

  // ── Org Overrides ───────────────────────────────────────────────────────────

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
}
