import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailChannelService {
  constructor(private readonly mailer: MailerService) {}

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.mailer.sendMail({ to, subject, html });
  }
}
