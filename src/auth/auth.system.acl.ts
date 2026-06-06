import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  userAc,
  defaultStatements as defaultAdminStatements,
  defaultRoles as adminDefaultRoles,
} from 'better-auth/plugins/admin/access';

export const adminPluginAcl = createAccessControl({
  ...defaultAdminStatements,
});

const adminRole = adminPluginAcl.newRole({
  ...adminAc.statements,
});

const userRole = adminPluginAcl.newRole({
  ...userAc.statements,
});

export const adminPluginRoles = {
  ...adminDefaultRoles,
  admin: adminRole,
  user: userRole,
};

export const adminConfig = {
  ac: adminPluginAcl,
  roles: adminPluginRoles,
} as const;
