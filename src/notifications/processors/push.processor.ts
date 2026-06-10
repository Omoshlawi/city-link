import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationChannel, NotificationStatus } from '../../generated/prisma/client';
import { PushChannelService } from '../channels/push-channel.service';
import { NotificationLogService } from '../log.service';
import { PushJobPayload } from '../dispatch.service';
import { NOTIFICATION_PROVIDERS, QUEUE_NAMES } from '../notifications.constants';

@Processor(QUEUE_NAMES.PUSH)
export class PushNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(PushNotificationProcessor.name);

  constructor(
    private readonly pushChannel: PushChannelService,
    private readonly logService: NotificationLogService,
  ) {
    super();
  }

  async process(job: Job<PushJobPayload>): Promise<void> {
    const attemptNumber = job.attemptsMade + 1;
    const { dispatchId, templateKey, recipientRef, recipientId, organizationId, title, body, data } =
      job.data;

    try {
      const receiptId = await this.pushChannel.send(recipientRef, title, body, data);

      await this.logService.write({
        dispatchId,
        templateKey,
        channel: NotificationChannel.PUSH,
        provider: NOTIFICATION_PROVIDERS.EXPO,
        status: NotificationStatus.SENT,
        attemptNumber,
        recipientRef,
        recipientId,
        organizationId,
        body,
        jobId: job.id,
        providerMeta: receiptId ? { receiptId } : undefined,
        sentAt: new Date(),
      });

      this.logger.debug(`Push sent to token …${recipientRef.slice(-8)} — dispatchId: ${dispatchId}`);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);

      await this.logService.write({
        dispatchId,
        templateKey,
        channel: NotificationChannel.PUSH,
        provider: NOTIFICATION_PROVIDERS.EXPO,
        status: NotificationStatus.FAILED,
        attemptNumber,
        recipientRef,
        recipientId,
        organizationId,
        body,
        jobId: job.id,
        error,
        failedAt: new Date(),
      });

      this.logger.error(`Push failed for token …${recipientRef.slice(-8)} (attempt ${attemptNumber}): ${error}`);
      throw err;
    }
  }
}
