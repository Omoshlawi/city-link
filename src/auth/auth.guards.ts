import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Request } from 'express';
import { REQUIRE_ACTIVE_ORGANIZATION_KEY } from './auth.constants';
import {
  RequireOrganizationPermission,
  RequireSystemPermission,
} from './auth.decorators';
import { BetterAuthWithPlugins } from './auth.types';

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
    const session = await this.authService.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
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

@Injectable()
export class RequireOrganizationPermissionsGuard implements CanActivate {
  private logger = new Logger(RequireOrganizationPermissionsGuard.name);
  constructor(
    private readonly authService: AuthService<BetterAuthWithPlugins>,
    private reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.get(
      RequireOrganizationPermission,
      context.getHandler(),
    );
    if (!permissions || Object.keys(permissions).length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const { success } = await this.authService.api.hasPermission({
      headers: fromNodeHeaders(request.headers),
      body: {
        permissions,
      },
    });
    if (!success) {
      this.logger.warn(
        `Access denied. Missing permissions: ${JSON.stringify(permissions)}`,
      );
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
    return true;
  }
}

@Injectable()
export class RequireSystemPermissionsGuard implements CanActivate {
  private logger = new Logger(RequireSystemPermissionsGuard.name);
  constructor(
    private readonly authService: AuthService<BetterAuthWithPlugins>,
    private reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.get(
      RequireSystemPermission,
      context.getHandler(),
    );
    if (!permissions || Object.keys(permissions).length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const { success } = await this.authService.api.userHasPermission({
      headers: fromNodeHeaders(request.headers),
      body: {
        permissions,
      },
    });
    if (!success) {
      this.logger.warn(
        `Access denied. Missing permissions: ${JSON.stringify(permissions)}`,
      );
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
    return true;
  }
}
