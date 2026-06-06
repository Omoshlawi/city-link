import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Request } from 'express';
import { REQUIRE_ACTIVE_ORGANIZATION_KEY } from './auth.constants';
import { BetterAuthWithPlugins, UserSession } from './auth.types';

@Injectable()
export class RequireActiveOrganizationGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService<BetterAuthWithPlugins>,
    private reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireActiveOrganization = this.reflector.get<
      | {
          organization: boolean;
          team: boolean;
        }
      | undefined
    >(REQUIRE_ACTIVE_ORGANIZATION_KEY, context.getHandler());

    if (!requireActiveOrganization) return true;

    const { organization, team } = requireActiveOrganization;
    const request = context.switchToHttp().getRequest<Request>();
    const session = (await this.authService.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })) as UserSession | null;
    if (!session || !session.session || !session.user) return false;

    if (organization && !session.session.activeOrganizationId) {
      throw new ForbiddenException(
        'Organization must be active to access this resource',
      );
    }
    if (team && !session.session.activeTeamId) {
      throw new ForbiddenException(
        'Team must be active to access this resource',
      );
    }

    return true;
  }
}
