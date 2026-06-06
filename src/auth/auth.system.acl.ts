import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  userAc,
  defaultStatements as defaultAdminStatements,
  defaultRoles as adminDefaultRoles,
} from 'better-auth/plugins/admin/access';

const adminPluginAcl = createAccessControl({
  ...defaultAdminStatements,
});

const adminRole = adminPluginAcl.newRole({
  ...adminAc.statements,
});

const userRole = adminPluginAcl.newRole({
  ...userAc.statements,
});

const adminPluginRoles = {
  ...adminDefaultRoles,
  admin: adminRole,
  user: userRole,
};

type AdminPluginProps = Parameters<typeof admin>[0];

export const adminConfig: AdminPluginProps = {
  ac: adminPluginAcl,
  roles: adminPluginRoles,
} as const;
