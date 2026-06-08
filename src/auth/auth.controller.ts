import { Controller, Get, Query } from '@nestjs/common';
import { ExtendedAuthService } from './auth.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiErrorsResponse } from '../common/common.decorators';
import { ListMembershipDto, QueryMembershipDto } from './auth.dto';
import { OriginalUrl } from '../common/query-builder';
import { Session } from '@thallesp/nestjs-better-auth';
import { type UserSession } from './auth.types';

@Controller()
export class ExtendedAuthController {
  constructor(private readonly authService: ExtendedAuthService) {}

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
}
