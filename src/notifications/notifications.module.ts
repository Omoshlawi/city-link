import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { MailerModule } from '@nestjs-modules/mailer';
import { TemplatesModule } from '../templates/templates.module';
import { NotificationConfig } from './notifications.config';
import { QUEUE_NAMES } from './notifications.constants';
import { SMS_CHANNEL } from './channels/channel.interface';
import { EmailChannelService } from './channels/email-channel.service';
import { PushChannelService } from './channels/push-channel.service';
import { SmsChannelService } from './channels/sms-channel.service';
import { PushTokenService } from './push-token.service';
import { NotificationLogService } from './log.service';
import { NotificationInboxService } from './inbox.service';
import { NotificationDispatchService } from './dispatch.service';
import { EmailNotificationProcessor } from './processors/email.processor';
import { PushNotificationProcessor } from './processors/push.processor';
import { SmsNotificationProcessor } from './processors/sms.processor';
import { InboxController } from './controllers/inbox.controller';
import { PushTokenController } from './controllers/push-token.controller';
import { NotificationAdminController } from './controllers/notifications-admin.controller';

@Global()
@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.PUSH },
      { name: QUEUE_NAMES.SMS },
    ),
    BullBoardModule.forFeature(
      { name: QUEUE_NAMES.EMAIL, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.PUSH, adapter: BullMQAdapter },
      { name: QUEUE_NAMES.SMS, adapter: BullMQAdapter },
    ),
    MailerModule.forRootAsync({
      inject: [NotificationConfig],
      useFactory: (config: NotificationConfig) => ({
        transport: {
          host: config.smtpHost,
          port: config.smtpPort,
          auth:
            config.smtpUser && config.smtpPass
              ? { user: config.smtpUser, pass: config.smtpPass }
              : undefined,
        },
        defaults: { from: config.emailFrom },
      }),
    }),
    TemplatesModule,
  ],
  providers: [
    NotificationConfig,
    EmailChannelService,
    PushChannelService,
    { provide: SMS_CHANNEL, useClass: SmsChannelService },
    PushTokenService,
    NotificationLogService,
    NotificationInboxService,
    NotificationDispatchService,
    EmailNotificationProcessor,
    PushNotificationProcessor,
    SmsNotificationProcessor,
  ],
  controllers: [
    InboxController,
    PushTokenController,
    NotificationAdminController,
  ],
  exports: [
    NotificationDispatchService,
    NotificationInboxService,
    PushTokenService,
    EmailChannelService,
    PushChannelService,
    SMS_CHANNEL,
  ],
})
export class NotificationsModule {}
