import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  NotificationChannel,
  NotificationStatus,
} from '../../generated/prisma/client';
import { EmailChannelService } from '../channels/email-channel.service';
import { NotificationLogService } from '../log.service';
import { EmailJobPayload } from '../dispatch.service';
import {
  NOTIFICATION_PROVIDERS,
  QUEUE_NAMES,
} from '../notifications.constants';

@Processor(QUEUE_NAMES.EMAIL)
export class EmailNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailNotificationProcessor.name);

  constructor(
    private readonly emailChannel: EmailChannelService,
    private readonly logService: NotificationLogService,
  ) {
    super();
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    const attemptNumber = job.attemptsMade + 1;
    const {
      dispatchId,
      templateKey,
      recipientRef,
      recipientId,
      organizationId,
      subject,
      html,
    } = job.data;

    try {
      await this.emailChannel.send(recipientRef, subject, html);

      await this.logService.write({
        dispatchId,
        templateKey,
        channel: NotificationChannel.EMAIL,
        provider: NOTIFICATION_PROVIDERS.SMTP,
        status: NotificationStatus.SENT,
        attemptNumber,
        recipientRef,
        recipientId,
        organizationId,
        subject,
        body: html,
        jobId: job.id,
        sentAt: new Date(),
      });

      this.logger.debug(
        `Email sent to ${recipientRef} — dispatchId: ${dispatchId}`,
      );
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);

      await this.logService.write({
        dispatchId,
        templateKey,
        channel: NotificationChannel.EMAIL,
        provider: NOTIFICATION_PROVIDERS.SMTP,
        status: NotificationStatus.FAILED,
        attemptNumber,
        recipientRef,
        recipientId,
        organizationId,
        subject,
        body: html,
        jobId: job.id,
        error,
        failedAt: new Date(),
      });

      this.logger.error(
        `Email failed for ${recipientRef} (attempt ${attemptNumber}): ${error}`,
      );
      throw err; // rethrow so BullMQ handles retry
    }
  }
}
