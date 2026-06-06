import { organization } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import {
  defaultStatements as defaultOrganizationStatements,
  memberAc,
  adminAc as organizationAdminAc,
  ownerAc,
} from 'better-auth/plugins/organization/access';

const organizationPluginAcl = createAccessControl({
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

const organizationPluginRoles = {
  admin: organizationAdminRole,
  owner: organizationOwnerRole,
  member: organizationMemberRole,
} as const;

type OrganizationPluginProps = Parameters<typeof organization>[0];

export const organizationConfig: OrganizationPluginProps = {
  ac: organizationPluginAcl,
  roles: organizationPluginRoles,
  teams: {
    enabled: true,
  },
  dynamicAccessControl: {
    enabled: true,
  },
} as const;
