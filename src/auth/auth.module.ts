import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  RequireActiveOrganizationGuard,
  RequireOrganizationPermissionsGuard,
  RequireSystemPermissionsGuard,
} from './auth.guards';

@Module({})
export class AuthModule {
  static globalProviders = [
    { provide: APP_GUARD, useClass: RequireActiveOrganizationGuard },
    { provide: APP_GUARD, useClass: RequireOrganizationPermissionsGuard },
    { provide: APP_GUARD, useClass: RequireSystemPermissionsGuard },
  ];
}
