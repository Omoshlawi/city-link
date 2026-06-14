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
import {
  MemberHasPermission,
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
  CreateServiceClassDto,
  GetServiceClassResponseDto,
  QueryServiceClassDto,
  QueryServiceClassResponseDto,
  UpdateServiceClassDto,
} from './service-class.dto';
import { ServiceClassService } from './service-class.service';

@ApiTags('ServiceClasses')
@RequireActiveOrganization()
@Controller('service-classes')
export class ServiceClassController {
  constructor(private readonly service: ServiceClassService) {}

  @Get('/')
  @ApiOperation({ summary: 'List service classes for the active operator' })
  @ApiOkResponse({ type: QueryServiceClassResponseDto })
  @ApiErrorsResponse()
  getAll(
    @Query() query: QueryServiceClassDto,
    @OriginalUrl() originalUrl: string,
    @Session() { session }: UserSession,
  ) {
    return this.service.getAll(session.activeOrganizationId!, query, originalUrl);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get a single service class' })
  @ApiOkResponse({ type: GetServiceClassResponseDto })
  @ApiErrorsResponse()
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Session() { session }: UserSession,
  ) {
    return this.service.getOne(id, session.activeOrganizationId!);
  }

  @Post('/')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Create a service class' })
  @ApiOkResponse({ type: GetServiceClassResponseDto })
  @ApiErrorsResponse({ badRequest: true, conflict: true })
  create(
    @Body() dto: CreateServiceClassDto,
    @Session() { session }: UserSession,
  ) {
    return this.service.create(session.activeOrganizationId!, dto);
  }

  @Patch('/:id')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Update a service class' })
  @ApiOkResponse({ type: GetServiceClassResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceClassDto,
    @Session() { session }: UserSession,
  ) {
    return this.service.update(id, session.activeOrganizationId!, dto);
  }

  @Delete('/:id')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Delete a service class' })
  @ApiOkResponse({ type: GetServiceClassResponseDto })
  @ApiErrorsResponse()
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
    @Session() { session }: UserSession,
  ) {
    return this.service.delete(id, session.activeOrganizationId!, query);
  }

  @Post('/:id/restore')
  @MemberHasPermission({ permissions: { routes: ['manage'] } })
  @ApiOperation({ summary: 'Restore a soft-deleted service class' })
  @ApiOkResponse({ type: GetServiceClassResponseDto })
  @ApiErrorsResponse()
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session }: UserSession,
  ) {
    return this.service.restore(id, session.activeOrganizationId!, query);
  }
}
