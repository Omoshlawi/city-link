import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Expo, { ExpoPushTicket } from 'expo-server-sdk';
import { NotificationConfig } from '../notifications.config';

@Injectable()
export class PushChannelService implements OnModuleInit {
  private readonly logger = new Logger(PushChannelService.name);
  private expo!: Expo;

  constructor(private readonly config: NotificationConfig) {}

  onModuleInit() {
    this.expo = new Expo({ accessToken: this.config.expoAccessToken });
  }

  async send(
    token: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<string | null> {
    const [ticket] = await this.expo.sendPushNotificationsAsync([
      { to: token, title, body, data },
    ]);

    if (ticket.status === 'error') {
      const t = ticket;
      throw new Error(
        `Expo push error: ${t.message} (${t.details?.error ?? 'unknown'})`,
      );
    }

    const successTicket = ticket;
    this.logger.debug(`Push sent to ${token}, receipt id: ${successTicket.id}`);
    return successTicket.id;
  }
}
