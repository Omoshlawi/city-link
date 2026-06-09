import {
  Controller,
  Get,
  Query,
  Param,
  Delete,
  ParseUUIDPipe,
  Post,
  Patch,
  Body,
} from '@nestjs/common';
import { AddressHierarchyService } from './address-hierarchy.service';
import {
  CreateAddressHierarchyDto,
  GetAddressHierarchyResponseDto,
  QueryAddressHierarchyDto,
  QueryAddressHierarchyResponseDto,
  UpdateAddressHierarchyDto,
} from './address-hierarchy.dto';
import { OptionalAuth, UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import {
  CustomRepresentationQueryDto,
  DeleteQueryDto,
  OriginalUrl,
} from '../common/query-builder';
import { ApiErrorsResponse } from '../common/common.decorators';
@Controller('address-hierarchy')
export class AddressHierarchyController {
  constructor(
    private readonly addressHierarchyService: AddressHierarchyService,
  ) {}

  @Get('/')
  @OptionalAuth()
  @ApiOperation({ summary: 'Query AddressHierarchy' })
  @ApiOkResponse({ type: QueryAddressHierarchyResponseDto })
  @ApiErrorsResponse()
  queryAddressHierarchy(
    @Query() query: QueryAddressHierarchyDto,
    @OriginalUrl() originalUrl: string,
  ) {
    return this.addressHierarchyService.getAll(query, originalUrl);
  }

  @Delete('/:id')
  @UserHasPermission({ permission: { adrressHierArchy: ['delete'] } })
  @ApiOperation({ summary: 'Delete AddressHierarchy' })
  @ApiOkResponse({ type: GetAddressHierarchyResponseDto })
  @ApiErrorsResponse()
  deleteAddressHierarchy(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.addressHierarchyService.delete(id, query);
  }

  @Post('/:id/restore')
  @UserHasPermission({ permission: { adrressHierArchy: ['restore'] } })
  @ApiOperation({ summary: 'Restore AddressHierarchy' })
  @ApiOkResponse({ type: GetAddressHierarchyResponseDto })
  @ApiErrorsResponse()
  restoreAddressHierarchy(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.addressHierarchyService.restore(id, query);
  }

  @Post('/')
  @UserHasPermission({ permission: { adrressHierArchy: ['create'] } })
  @ApiOperation({ summary: 'Create AddressHierarchy' })
  @ApiOkResponse({ type: GetAddressHierarchyResponseDto })
  @ApiErrorsResponse()
  createAddressHierarchy(@Body() dto: CreateAddressHierarchyDto) {
    return this.addressHierarchyService.create(dto);
  }

  @Patch('/:id')
  @UserHasPermission({ permission: { adrressHierArchy: ['update'] } })
  @ApiOperation({ summary: 'Update AddressHierarchy' })
  @ApiOkResponse({ type: GetAddressHierarchyResponseDto })
  @ApiErrorsResponse()
  updateAddressHierarchy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressHierarchyDto,
  ) {
    return this.addressHierarchyService.update(id, dto);
  }
}
