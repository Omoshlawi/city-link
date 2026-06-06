import { Configuration, Value } from '@itgorillaz/configify';

@Configuration()
export class AuthConfig {
  @Value('BETTER_AUTH_URL', { default: 'http://localhost:2000' })
  betterAuthUrl!: string;
  @Value('TEMP_EMAIL_DOMAIN', { default: 'citylink.app' })
  temporaryEmailDomain!: string;
}
