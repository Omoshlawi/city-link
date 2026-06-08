import { Injectable } from '@nestjs/common';
import {
  AfterHook,
  type AuthHookContext,
  Hook,
} from '@thallesp/nestjs-better-auth';
import { OrganizationRole } from 'better-auth/plugins';
import capitalize from 'lodash/capitalize';
import { organizationConfig } from './auth.org.acl';
import dayjs from 'dayjs';

@Hook()
@Injectable()
export class AuthHook {
  constructor() {}
  @AfterHook('/organization/list-roles')
  handle(ctx: AuthHookContext) {
    const roles = [...(ctx.context.returned as Array<OrganizationRole>)].map(
      (role) => ({ ...role, label: this.toLabel(role.role) }),
    );
    const defaultRoles = Object.entries(organizationConfig?.roles ?? {}).map(
      ([role, val]) => ({
        organizationId: crypto.randomUUID(),
        role: role,
        permission: val?.statements as Record<string, Array<string>>,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        id: crypto.randomUUID(),
        label: this.toLabel(role),
      }),
    );

    ctx.context.returned = [...defaultRoles, ...roles];
  }

  private generateUuid() {}

  private toLabel(role: string) {
    return capitalize(role);
  }
}
