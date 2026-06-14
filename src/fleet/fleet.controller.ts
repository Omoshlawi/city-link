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
import { MemberHasPermission, Session } from '@thallesp/nestjs-better-auth';
import { RequireActiveOrganization } from '../auth/auth.decorators';
import type { UserSession } from '../auth/auth.types';
import { ApiErrorsResponse } from '../common/common.decorators';
import {
  CustomRepresentationQueryDto,
  DeleteQueryDto,
  OriginalUrl,
  QueryBuilderDto,
} from '../common/query-builder';
import {
  CreateFleetDto,
  CreateFleetRouteDto,
  GetFleetResponseDto,
  GetFleetRouteResponseDto,
  QueryFleetDto,
  QueryFleetResponseDto,
  QueryFleetRouteResponseDto,
  UpdateFleetDto,
} from './fleet.dto';
import { FleetRouteService } from './fleet-route.service';
import { FleetService } from './fleet.service';

@ApiTags('Fleet')
@RequireActiveOrganization()
@Controller('fleets')
export class FleetController {
  constructor(
    private readonly fleetService: FleetService,
    private readonly fleetRouteService: FleetRouteService,
  ) {}

  // ─── Fleet ─────────────────────────────────────────────────────────────────

  @Get('/')
  @ApiOperation({ summary: 'List vehicles for the active operator' })
  @ApiOkResponse({ type: QueryFleetResponseDto })
  @ApiErrorsResponse()
  getAll(
    @Query() query: QueryFleetDto,
    @OriginalUrl() originalUrl: string,
    @Session() { session }: UserSession,
  ) {
    return this.fleetService.getAll(session.activeOrganizationId!, query, originalUrl);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get a single vehicle' })
  @ApiOkResponse({ type: GetFleetResponseDto })
  @ApiErrorsResponse()
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() { session }: UserSession,
  ) {
    return this.fleetService.getOne(id, session.activeOrganizationId!);
  }

  @Post('/')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Register a vehicle' })
  @ApiOkResponse({ type: GetFleetResponseDto })
  @ApiErrorsResponse({ badRequest: true, conflict: true })
  create(
    @Body() dto: CreateFleetDto,
    @Session() { session }: UserSession,
  ) {
    return this.fleetService.create(session.activeOrganizationId!, dto);
  }

  @Patch('/:id')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiOkResponse({ type: GetFleetResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFleetDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session }: UserSession,
  ) {
    return this.fleetService.update(id, session.activeOrganizationId!, dto, query);
  }

  @Delete('/:id')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Delete a vehicle' })
  @ApiOkResponse({ type: GetFleetResponseDto })
  @ApiErrorsResponse()
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
    @Session() { session }: UserSession,
  ) {
    return this.fleetService.delete(id, session.activeOrganizationId!, query);
  }

  @Post('/:id/restore')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Restore a soft-deleted vehicle' })
  @ApiOkResponse({ type: GetFleetResponseDto })
  @ApiErrorsResponse()
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session }: UserSession,
  ) {
    return this.fleetService.restore(id, session.activeOrganizationId!, query);
  }

  // ─── Fleet Routes (nested) ─────────────────────────────────────────────────

  @Get('/:fleetId/routes')
  @ApiOperation({ summary: "List a vehicle's route assignments" })
  @ApiOkResponse({ type: QueryFleetRouteResponseDto })
  @ApiErrorsResponse()
  getRoutes(
    @Param('fleetId', ParseUUIDPipe) fleetId: string,
    @Query() query: QueryBuilderDto,
    @OriginalUrl() originalUrl: string,
    @Session() { session }: UserSession,
  ) {
    return this.fleetRouteService.getAll(fleetId, session.activeOrganizationId!, query, originalUrl);
  }

  @Post('/:fleetId/routes')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Assign a route to a vehicle' })
  @ApiOkResponse({ type: GetFleetRouteResponseDto })
  @ApiErrorsResponse({ badRequest: true, conflict: true })
  assignRoute(
    @Param('fleetId', ParseUUIDPipe) fleetId: string,
    @Body() dto: CreateFleetRouteDto,
    @Session() { session }: UserSession,
  ) {
    return this.fleetRouteService.create(fleetId, session.activeOrganizationId!, dto);
  }

  @Delete('/:fleetId/routes/:id')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Remove a route assignment from a vehicle' })
  @ApiOkResponse({ type: GetFleetRouteResponseDto })
  @ApiErrorsResponse()
  removeRoute(
    @Param('fleetId', ParseUUIDPipe) fleetId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Session() { session }: UserSession,
  ) {
    return this.fleetRouteService.delete(fleetId, id, session.activeOrganizationId!);
  }
}
