/* eslint-disable @typescript-eslint/unbound-method */
import { Configuration, Value } from '@itgorillaz/configify';
import z from 'zod';

@Configuration()
export class NotificationConfig {
  @Value('SMTP_HOST', { default: 'localhost' })
  smtpHost!: string;

  @Value('SMTP_PORT', {
    parse: z.coerce.number().optional().parse,
    default: 587,
  })
  smtpPort!: number;

  @Value('SMTP_USER', { default: '' })
  smtpUser!: string;

  @Value('SMTP_PASS', { default: '' })
  smtpPass!: string;

  @Value('EMAIL_FROM', { default: 'noreply@citylink.app' })
  emailFrom!: string;

  @Value('EXPO_ACCESS_TOKEN', {
    parse: z.string().optional().parse,
    default: undefined,
  })
  expoAccessToken: string | undefined;
}
