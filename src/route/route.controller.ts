import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  MemberHasPermission,
  OptionalAuth,
  Session,
} from '@thallesp/nestjs-better-auth';
import { RequireActiveOrganization } from '../auth/auth.decorators';
import type { UserSession } from '../auth/auth.types';
import { ApiErrorsResponse } from '../common/common.decorators';
import {
  CustomRepresentationQueryDto,
  DeleteQueryDto,
  OriginalUrl,
} from '../common/query-builder';
import {
  CreateLinkPricingDto,
  CreateRouteDto,
  GetLinkPricingResponseDto,
  GetRouteLinkResponseDto,
  GetRouteResponseDto,
  QueryLinkPricingDto,
  QueryLinkPricingResponseDto,
  QueryRouteDto,
  QueryRouteResponseDto,
  SetRouteLinksDto,
  UpdateLinkPricingDto,
  UpdateRouteDto,
} from './route.dto';
import { LinkPricingService } from './link-pricing.service';
import { RouteLinkService } from './route-link.service';
import { RouteService } from './route.service';

@ApiTags('Routes')
@RequireActiveOrganization()
@Controller('routes')
export class RouteController {
  constructor(
    private readonly service: RouteService,
    private readonly linkService: RouteLinkService,
    private readonly pricingService: LinkPricingService,
  ) {}

  // ─── Route CRUD ───────────────────────────────────────────────────────────

  @Get('/')
  @OptionalAuth()
  @ApiOperation({ summary: 'List routes' })
  @ApiOkResponse({ type: QueryRouteResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  queryRoutes(
    @Query() query: QueryRouteDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.service.getAllRoutes(query, originalUrl);
  }

  @Get('/:id')
  @OptionalAuth()
  @ApiOperation({ summary: 'Get a single route' })
  @ApiOkResponse({ type: GetRouteResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  getRoute(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getOneRoute(id);
  }

  @Post('/')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Create a route' })
  @ApiOkResponse({ type: GetRouteResponseDto })
  @ApiErrorsResponse({ badRequest: true, conflict: true })
  createRoute(@Body() dto: CreateRouteDto) {
    return this.service.createRoute(dto);
  }

  @Patch('/:id')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Update a route' })
  @ApiOkResponse({ type: GetRouteResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRouteDto,
  ) {
    return this.service.updateRoute(id, dto);
  }

  @Delete('/:id')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({
    summary: 'Delete a route (soft by default, purge=true to hard delete)',
  })
  @ApiOkResponse({ type: GetRouteResponseDto })
  @ApiErrorsResponse()
  deleteRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.service.deleteRoute(id, query);
  }

  @Post('/:id/restore')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Restore a soft-deleted route' })
  @ApiOkResponse({ type: GetRouteResponseDto })
  @ApiErrorsResponse()
  restoreRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.service.restoreRoute(id, query);
  }

  // ─── RouteLink ────────────────────────────────────────────────────────────

  @Get('/:id/links')
  @OptionalAuth()
  @ApiOperation({ summary: "Get a route's ordered link sequence" })
  @ApiOkResponse({ isArray: true, type: GetRouteLinkResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  getRouteLinks(@Param('id', ParseUUIDPipe) id: string) {
    return this.linkService.getRouteLinks(id);
  }

  @Put('/:id/links')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: "Replace a route's entire ordered link sequence" })
  @ApiOkResponse({ isArray: true, type: GetRouteLinkResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  setRouteLinks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRouteLinksDto,
  ) {
    return this.linkService.setRouteLinks(id, dto);
  }

  // ─── LinkPricing ──────────────────────────────────────────────────────────

  @Get('/:id/pricing')
  @MemberHasPermission({ permissions: { pricing: ['manage'] } })
  @ApiOperation({ summary: "List this operator's pricing for a route" })
  @ApiOkResponse({ type: QueryLinkPricingResponseDto })
  @ApiErrorsResponse()
  getAllPricing(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryLinkPricingDto,
    @OriginalUrl() originalUrl: string,
    @Session() { session }: UserSession,
  ) {
    return this.pricingService.getAllPricing(
      id,
      session.activeOrganizationId!,
      query,
      originalUrl,
    );
  }

  @Post('/:id/pricing')
  @MemberHasPermission({ permissions: { pricing: ['manage'] } })
  @ApiOperation({ summary: 'Add a pricing entry for a route link' })
  @ApiOkResponse({ type: GetLinkPricingResponseDto })
  @ApiErrorsResponse({ badRequest: true, conflict: true })
  createPricing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLinkPricingDto,
    @Session() { session }: UserSession,
  ) {
    return this.pricingService.createPricing(id, session.activeOrganizationId!, dto);
  }

  @Patch('/:id/pricing/:pricingId')
  @MemberHasPermission({ permissions: { pricing: ['manage'] } })
  @ApiOperation({ summary: 'Update a pricing entry' })
  @ApiOkResponse({ type: GetLinkPricingResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updatePricing(
    @Param('pricingId', ParseUUIDPipe) pricingId: string,
    @Body() dto: UpdateLinkPricingDto,
    @Session() { session }: UserSession,
  ) {
    return this.pricingService.updatePricing(
      pricingId,
      session.activeOrganizationId!,
      dto,
    );
  }

  @Delete('/:id/pricing/:pricingId')
  @MemberHasPermission({ permissions: { pricing: ['manage'] } })
  @ApiOperation({
    summary:
      'Delete a pricing entry (soft by default, purge=true to hard delete)',
  })
  @ApiOkResponse({ type: GetLinkPricingResponseDto })
  @ApiErrorsResponse()
  deletePricing(
    @Param('pricingId', ParseUUIDPipe) pricingId: string,
    @Query() query: DeleteQueryDto,
    @Session() { session }: UserSession,
  ) {
    return this.pricingService.deletePricing(
      pricingId,
      session.activeOrganizationId!,
      query,
    );
  }

  @Post('/:id/pricing/:pricingId/restore')
  @MemberHasPermission({ permissions: { pricing: ['manage'] } })
  @ApiOperation({ summary: 'Restore a soft-deleted pricing entry' })
  @ApiOkResponse({ type: GetLinkPricingResponseDto })
  @ApiErrorsResponse()
  restorePricing(
    @Param('pricingId', ParseUUIDPipe) pricingId: string,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session }: UserSession,
  ) {
    return this.pricingService.restorePricing(
      pricingId,
      session.activeOrganizationId!,
      query,
    );
  }
}
