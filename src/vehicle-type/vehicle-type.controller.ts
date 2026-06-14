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
  CreateVehicleTypeDto,
  GetVehicleTypeResponseDto,
  QueryVehicleTypeDto,
  QueryVehicleTypeResponseDto,
  UpdateVehicleTypeDto,
} from './vehicle-type.dto';
import { VehicleTypeService } from './vehicle-type.service';

@ApiTags('VehicleTypes')
@Controller('vehicle-types')
export class VehicleTypeController {
  constructor(private readonly service: VehicleTypeService) {}

  @Get('/')
  @OptionalAuth()
  @ApiOperation({ summary: 'List vehicle types' })
  @ApiOkResponse({ type: QueryVehicleTypeResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  getAll(
    @Query() query: QueryVehicleTypeDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.service.getAll(query, originalUrl);
  }

  @Get('/:id')
  @OptionalAuth()
  @ApiOperation({ summary: 'Get a single vehicle type' })
  @ApiOkResponse({ type: GetVehicleTypeResponseDto })
  @ApiErrorsResponse({ unauthorized: false, forbidden: false })
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getOne(id);
  }

  @Post('/')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Create a vehicle type' })
  @ApiOkResponse({ type: GetVehicleTypeResponseDto })
  @ApiErrorsResponse({ badRequest: true, conflict: true })
  create(@Body() dto: CreateVehicleTypeDto) {
    return this.service.create(dto);
  }

  @Patch('/:id')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Update a vehicle type' })
  @ApiOkResponse({ type: GetVehicleTypeResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleTypeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete('/:id')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Delete a vehicle type' })
  @ApiOkResponse({ type: GetVehicleTypeResponseDto })
  @ApiErrorsResponse()
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.service.delete(id, query);
  }

  @Post('/:id/restore')
  @UserHasPermission({ permission: { network: ['manage'] } })
  @ApiOperation({ summary: 'Restore a soft-deleted vehicle type' })
  @ApiOkResponse({ type: GetVehicleTypeResponseDto })
  @ApiErrorsResponse()
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.service.restore(id, query);
  }
}
