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
  CreateServiceClassDto,
  GetServiceClassResponseDto,
  QueryServiceClassDto,
  QueryServiceClassResponseDto,
  UpdateServiceClassDto,
} from './service-class.dto';
import { ServiceClassService } from './service-class.service';

@ApiTags('ServiceClasses')
@Controller('service-classes')
export class ServiceClassController {
  constructor(private readonly service: ServiceClassService) {}

  @Get('/')
  @OptionalAuth()
  @ApiOperation({ summary: 'List service classes (QoS levels)' })
  @ApiOkResponse({ type: QueryServiceClassResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  getAll(
    @Query() query: QueryServiceClassDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.service.getAll(query, originalUrl);
  }

  @Get('/:id')
  @OptionalAuth()
  @ApiOperation({ summary: 'Get a single service class' })
  @ApiOkResponse({ type: GetServiceClassResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getOne(id);
  }

  @Post('/')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Create a service class' })
  @ApiOkResponse({ type: GetServiceClassResponseDto })
  @ApiErrorsResponse({ badRequest: true, conflict: true })
  create(@Body() dto: CreateServiceClassDto) {
    return this.service.create(dto);
  }

  @Patch('/:id')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Update a service class' })
  @ApiOkResponse({ type: GetServiceClassResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceClassDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete('/:id')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Delete a service class' })
  @ApiOkResponse({ type: GetServiceClassResponseDto })
  @ApiErrorsResponse()
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.service.delete(id, query);
  }

  @Post('/:id/restore')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Restore a soft-deleted service class' })
  @ApiOkResponse({ type: GetServiceClassResponseDto })
  @ApiErrorsResponse()
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.service.restore(id, query);
  }
}
