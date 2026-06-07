import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrorsResponse } from '../common/common.decorators';
import {
  CustomRepresentationQueryDto,
  DeleteQueryDto,
  OriginalUrl,
} from '../common/query-builder';
import {
  QueryTemplatesDto,
  QueryTemplatesResponseDto,
  QueryTemplateVersionsDto,
  QueryTemplateVersionsResponseDto,
  RestoreVersionDto,
  TemplateResponseDto,
  UpdateTemplateSlotsDto,
} from './templates.dto';
import { TemplatesService } from './templates.service';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

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

  @Post('/:key/versions/:version/restore')
  // @RequireSystemPermission({ templates: ['update'] })
  @ApiOperation({ summary: 'Restore a system template to a past version' })
  @ApiOkResponse({ type: TemplateResponseDto })
  @ApiErrorsResponse()
  restoreTemplateToVersion(
    @Param('key') key: string,
    @Param('version', ParseIntPipe) version: number,
    @Body() dto: RestoreVersionDto,
  ) {
    return this.templatesService.restoreToVersion(key, version, dto);
  }
}
