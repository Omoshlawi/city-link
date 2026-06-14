import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalAuth, UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiErrorsResponse } from '../common/common.decorators';
import {
  CustomRepresentationQueryDto,
  DeleteQueryDto,
  OriginalUrl,
} from '../common/query-builder';
import {
  CreateStageLinkDto,
  CreateStageDto,
  GetStageLinkResponseDto,
  GetStageResponseDto,
  QueryStageLinkDto,
  QueryStageLinkResponseDto,
  QueryStageDto,
  QueryStageResponseDto,
  UpdateStageLinkDto,
  UpdateStageDto,
} from './stage.dto';
import { StageLinkService } from './stage-link.service';
import { StageService } from './stage.service';

@ApiTags('Stages')
@Controller('stages')
export class StageController {
  constructor(
    private readonly service: StageService,
    private readonly linkService: StageLinkService,
  ) {}

  // ─── Stage endpoints ──────────────────────────────────────────────────────

  @Get('/')
  @OptionalAuth()
  @ApiOperation({ summary: 'List stages' })
  @ApiOkResponse({ type: QueryStageResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  queryStages(
    @Query() query: QueryStageDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.service.getAll(query, originalUrl);
  }

  @Get('/:id')
  @OptionalAuth()
  @ApiOperation({ summary: 'Get a single stage' })
  @ApiOkResponse({ type: GetStageResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  getStage(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getOne(id);
  }

  @Post('/')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Create a stage' })
  @ApiOkResponse({ type: GetStageResponseDto })
  @ApiErrorsResponse({ badRequest: true, conflict: true })
  createStage(@Body() dto: CreateStageDto) {
    return this.service.create(dto);
  }

  @Patch('/:id')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Update a stage' })
  @ApiOkResponse({ type: GetStageResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete('/:id')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Delete a stage' })
  @ApiOkResponse({ type: GetStageResponseDto })
  @ApiErrorsResponse()
  deleteStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.service.delete(id, query);
  }

  @Post('/:id/restore')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Restore a soft-deleted stage' })
  @ApiOkResponse({ type: GetStageResponseDto })
  @ApiErrorsResponse()
  restoreStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.service.restore(id, query);
  }

  // ─── StageLink endpoints (nested) ─────────────────────────────────────────

  @Get('/:id/links')
  @OptionalAuth()
  @ApiOperation({ summary: 'List stage links from or to this stage' })
  @ApiOkResponse({ type: QueryStageLinkResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  queryLinks(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryStageLinkDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.linkService.getAllLinks(id, query, originalUrl);
  }

  @Get('/:id/links/:linkId')
  @OptionalAuth()
  @ApiOperation({ summary: 'Get a single stage link' })
  @ApiOkResponse({ type: GetStageLinkResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  getLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
  ) {
    return this.linkService.getOneLink(id, linkId);
  }

  @Post('/:id/links')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Create a stage link from this stage to another' })
  @ApiOkResponse({ type: GetStageLinkResponseDto })
  @ApiErrorsResponse({ badRequest: true, conflict: true })
  createLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStageLinkDto,
  ) {
    return this.linkService.createLink(id, dto);
  }

  @Patch('/:id/links/:linkId')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Update a stage link' })
  @ApiOkResponse({ type: GetStageLinkResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Body() dto: UpdateStageLinkDto,
  ) {
    return this.linkService.updateLink(id, linkId, dto);
  }

  @Delete('/:id/links/:linkId')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Delete a stage link' })
  @ApiOkResponse({ type: GetStageLinkResponseDto })
  @ApiErrorsResponse()
  deleteLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.linkService.deleteLink(id, linkId, query);
  }

  @Post('/:id/links/:linkId/restore')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Restore a soft-deleted stage link' })
  @ApiOkResponse({ type: GetStageLinkResponseDto })
  @ApiErrorsResponse()
  restoreLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.linkService.restoreLink(id, linkId, query);
  }
}
