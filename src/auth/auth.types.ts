import { type UserSession as BetterAuthUserSession } from '@thallesp/nestjs-better-auth';
import { auth } from './auth.cli.config';

export type BetterAuthWithPlugins = typeof auth;

export interface UserSession extends BetterAuthUserSession {
  user: BetterAuthUserSession['user'] & {
    isAnonymous?: boolean;
    phoneNumber?: string | null;
    phoneNumberVerified?: boolean;
  };
  session: BetterAuthUserSession['session'] & {
    activeOrganizationId?: string;
    activeTeamId?: string;
    impersonatedBy?: string;
    stationId?: string | null;
  };
}
