import { Injectable, Logger } from '@nestjs/common';
import { ISmsChannel } from './channel.interface';

@Injectable()
export class SmsChannelService implements ISmsChannel {
  private readonly logger = new Logger(SmsChannelService.name);

  async send(to: string, _message: string): Promise<{ messageId?: string; raw?: unknown }> {
    this.logger.warn(`SMS channel not yet implemented — would have sent to ${to}`);
    return {};
  }
}
