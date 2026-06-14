// import { AdminOptions } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  userAc,
  defaultStatements as defaultAdminStatements,
  defaultRoles as adminDefaultRoles,
} from 'better-auth/plugins/admin/access';

const adminPluginAcl = createAccessControl({
  ...defaultAdminStatements,
  adrressHierArchy: ['create', 'update', 'delete', 'restore'],
  templates: ['create', 'update', 'delete', 'restore'],
  setting: ['manage-system', 'view'],
  network: ['manage'],
});

const adminRole = adminPluginAcl.newRole({
  ...adminAc.statements,
  adrressHierArchy: ['create', 'update', 'delete', 'restore'],
  templates: ['create', 'update', 'delete', 'restore'],
  setting: ['manage-system', 'view'],
  network: ['manage'],
});

const userRole = adminPluginAcl.newRole({
  ...userAc.statements,
});

export const adminPluginRoles = {
  ...adminDefaultRoles,
  admin: adminRole,
  user: userRole,
} as const;

export const adminConfig = {
  ac: adminPluginAcl,
  roles: adminPluginRoles,
} as const;
