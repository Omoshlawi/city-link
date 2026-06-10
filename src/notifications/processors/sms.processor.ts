import { Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  NotificationChannel,
  NotificationStatus,
} from '../../generated/prisma/client';
import type { ISmsChannel } from '../channels/channel.interface';
import { SMS_CHANNEL } from '../channels/channel.interface';
import { NotificationLogService } from '../log.service';
import { SmsJobPayload } from '../dispatch.service';
import {
  NOTIFICATION_PROVIDERS,
  QUEUE_NAMES,
} from '../notifications.constants';

@Processor(QUEUE_NAMES.SMS)
export class SmsNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsNotificationProcessor.name);

  constructor(
    @Inject(SMS_CHANNEL) private readonly smsChannel: ISmsChannel,
    private readonly logService: NotificationLogService,
  ) {
    super();
  }

  async process(job: Job<SmsJobPayload>): Promise<void> {
    const attemptNumber = job.attemptsMade + 1;
    const {
      dispatchId,
      templateKey,
      recipientRef,
      recipientId,
      organizationId,
      message,
    } = job.data;

    try {
      const result = await this.smsChannel.send(recipientRef, message);

      await this.logService.write({
        dispatchId,
        templateKey,
        channel: NotificationChannel.SMS,
        provider: NOTIFICATION_PROVIDERS.STUB,
        status: NotificationStatus.SENT,
        attemptNumber,
        recipientRef,
        recipientId,
        organizationId,
        body: message,
        jobId: job.id,
        providerMeta: result.raw ? { raw: result.raw } : undefined,
        sentAt: new Date(),
      });

      this.logger.debug(
        `SMS sent to ${recipientRef} — dispatchId: ${dispatchId}`,
      );
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);

      await this.logService.write({
        dispatchId,
        templateKey,
        channel: NotificationChannel.SMS,
        provider: NOTIFICATION_PROVIDERS.STUB,
        status: NotificationStatus.FAILED,
        attemptNumber,
        recipientRef,
        recipientId,
        organizationId,
        body: message,
        jobId: job.id,
        error,
        failedAt: new Date(),
      });

      this.logger.error(
        `SMS failed for ${recipientRef} (attempt ${attemptNumber}): ${error}`,
      );
      throw err;
    }
  }
}
