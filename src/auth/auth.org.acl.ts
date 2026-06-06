import { createAccessControl } from 'better-auth/plugins/access';
import {
  defaultStatements as defaultOrganizationStatements,
  memberAc,
  adminAc as organizationAdminAc,
  ownerAc,
  defaultRoles,
} from 'better-auth/plugins/organization/access';

export const organizationPluginAcl = createAccessControl({
  ...defaultOrganizationStatements,
});

const organizationAdminRole = organizationPluginAcl.newRole({
  ...organizationAdminAc.statements,
});

const organizationOwnerRole = organizationPluginAcl.newRole({
  ...ownerAc.statements,
});

const organizationMemberRole = organizationPluginAcl.newRole({
  ...memberAc.statements,
});

export const organizationPluginRoles = {
  admin: organizationAdminRole,
  owner: organizationOwnerRole,
  member: organizationMemberRole,
} as const;

export const organizationConfig = {
  ac: organizationPluginAcl,
  roles: defaultRoles,
  teams: {
    enabled: true,
  },
  dynamicAccessControl: {
    enabled: true,
  },
} as const;
