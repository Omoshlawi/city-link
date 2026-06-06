import { SetMetadata } from '@nestjs/common';
import { REQUIRE_ACTIVE_ORGANIZATION_KEY } from './auth.constants';

export const RequireActiveOrganization = (requireActiveTeam: boolean = false) =>
  SetMetadata(REQUIRE_ACTIVE_ORGANIZATION_KEY, {
    organization: true,
    team: requireActiveTeam,
  });
