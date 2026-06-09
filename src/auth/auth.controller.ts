import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { Session, UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiErrorsResponse } from '../common/common.decorators';
import { OriginalUrl } from '../common/query-builder';
import {
  AclResourcesResponseDto,
  CreatedUserResponseDto,
  CreateUserExtendedDto,
  ListMembershipDto,
  QueryMembershipDto,
} from './auth.dto';
import { ExtendedAuthService } from './auth.service';
import { type UserSession } from './auth.types';

@Controller()
export class ExtendedAuthController {
  constructor(private readonly authService: ExtendedAuthService) {}

  @Get('/acl-resources')
  @ApiOperation({
    summary: 'Get ACL resources for system and organization scopes',
  })
  @ApiOkResponse({ type: AclResourcesResponseDto })
  getAclResources(): AclResourcesResponseDto {
    return this.authService.getAclResources();
  }

  @Get('/list-memberships')
  @ApiOperation({ summary: 'Query Memberships' })
  @ApiOkResponse({ type: ListMembershipDto })
  @ApiErrorsResponse()
  listMemberships(
    @Query() query: QueryMembershipDto,
    @OriginalUrl() originalUrl: string,
    @Session() { user }: UserSession,
  ) {
    return this.authService.listMemberships(query, originalUrl, user);
  }

  @Get('/roles')
  @ApiOperation({ summary: 'List system roles' })
  getSystemRoles() {
    return this.authService.listSystemRoles();
  }

  @Post('/users')
  @ApiOperation({
    summary: 'Create user with optional username and phone number',
    description:
      'Extends Better Auth admin createUser: creates the account via Better Auth, then sets username and phoneNumber directly on the record.',
  })
  @ApiCreatedResponse({ type: CreatedUserResponseDto })
  @ApiErrorsResponse()
  @UserHasPermission({ permissions: { user: ['create'] } })
  createUser(@Body() body: CreateUserExtendedDto) {
    return this.authService.createUser(body);
  }
}
