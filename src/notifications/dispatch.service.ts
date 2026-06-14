import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { NotificationChannel } from '../generated/prisma/client';
import { TemplateRendererService } from '../templates/template-renderer.service';
import { UserSettingsService } from '../settings/user-settings.service';
import { NotificationInboxService } from './inbox.service';
import { PushTokenService } from './push-token.service';
import { QUEUE_NAMES, NotificationPriority } from './notifications.constants';

export interface SendFromTemplateDto {
  templateKey: string;
  recipient: {
    userId?: string;
    email?: string; // required if EMAIL channel resolves
    phone?: string; // required if SMS channel resolves
  };
  data: Record<string, unknown>;
  orgId?: string;
  channels?: NotificationChannel[]; // overrides template metadata channel defaults
  priority?: NotificationPriority;
  force?: boolean; // bypass user preferences when true
  internalNote?: string;
  visible?: boolean; // overrides template metadata inbox.visible
}

export interface EmailJobPayload {
  dispatchId: string;
  templateKey: string;
  recipientRef: string;
  recipientId?: string;
  organizationId?: string;
  subject: string;
  html: string;
}

export interface PushJobPayload {
  dispatchId: string;
  templateKey: string;
  recipientRef: string;
  recipientId?: string;
  organizationId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SmsJobPayload {
  dispatchId: string;
  templateKey: string;
  recipientRef: string;
  recipientId?: string;
  organizationId?: string;
  message: string;
}

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly templateRenderer: TemplateRendererService,
    private readonly userSettings: UserSettingsService,
    private readonly inboxService: NotificationInboxService,
    private readonly pushTokenService: PushTokenService,
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.PUSH) private readonly pushQueue: Queue,
    @InjectQueue(QUEUE_NAMES.SMS) private readonly smsQueue: Queue,
  ) {}

  async sendFromTemplate(
    dto: SendFromTemplateDto,
  ): Promise<{ dispatchId: string }> {
    const dispatchId = randomUUID();
    const priority = dto.priority ?? NotificationPriority.NORMAL;
    const userId = dto.recipient.userId;

    // 1. Render template once
    const rendered = await this.templateRenderer.render(
      dto.templateKey,
      dto.data,
      dto.orgId,
    );

    const slots = rendered.slots;
    const meta = rendered.metadata;

    // 2. Resolve channels — template metadata defaults, overridden by caller
    let channels: NotificationChannel[] =
      dto.channels ?? this.resolveTemplateChannels(meta);

    // 3. Filter by user preferences unless force=true
    if (!dto.force && userId) {
      channels = await this.filterByPreferences(
        channels,
        userId,
        dto.templateKey,
      );
    }

    // 4. Parse slot JSON payloads — inbox_data used by inbox row; push_data falls back to inbox_data
    let parsedInboxData: Record<string, unknown> | null = null;
    if (slots.inbox_data) {
      try {
        parsedInboxData = JSON.parse(slots.inbox_data) as Record<
          string,
          unknown
        >;
      } catch {
        this.logger.warn(
          `Invalid JSON in inbox_data slot for '${dto.templateKey}'`,
        );
      }
    }

    let parsedPushData: Record<string, unknown> | undefined =
      parsedInboxData ?? undefined;
    if (slots.push_data) {
      try {
        parsedPushData = JSON.parse(slots.push_data) as Record<string, unknown>;
      } catch {
        this.logger.warn(
          `Invalid JSON in push_data slot for '${dto.templateKey}'`,
        );
      }
    }

    // 5. Write inbox entry if inbox slots are present
    if (slots.inbox_title && slots.inbox_body && userId) {
      const resolvedNote = slots.internal_note ?? dto.internalNote;
      if (!resolvedNote) {
        throw new BadRequestException(
          `Template '${dto.templateKey}' creates an inbox entry but provides no internal_note slot and caller omitted internalNote`,
        );
      }
      const inboxVisible =
        dto.visible ??
        (meta?.inbox as Record<string, unknown>)?.visible ??
        true;

      await this.inboxService.create({
        dispatchId,
        userId,
        organizationId: dto.orgId,
        title: slots.inbox_title,
        body: slots.inbox_body,
        data: parsedInboxData,
        templateKey: dto.templateKey,
        internalNote: resolvedNote,
        visible: inboxVisible as boolean,
      });
    }

    // 6. Queue per-channel jobs
    const jobOpts = { priority };

    for (const channel of channels) {
      if (channel === NotificationChannel.EMAIL) {
        if (!dto.recipient.email) {
          this.logger.warn(
            `EMAIL channel resolved for '${dto.templateKey}' but no email in recipient`,
          );
          continue;
        }
        await this.emailQueue.add(
          QUEUE_NAMES.EMAIL,
          {
            dispatchId,
            templateKey: dto.templateKey,
            recipientRef: dto.recipient.email,
            recipientId: userId,
            organizationId: dto.orgId,
            subject: slots.email_subject ?? '',
            html: slots.email_body ?? '',
          } satisfies EmailJobPayload,
          jobOpts,
        );
      }

      if (channel === NotificationChannel.PUSH) {
        if (!userId) {
          this.logger.warn(
            `PUSH channel resolved for '${dto.templateKey}' but no userId`,
          );
          continue;
        }
        const tokens = await this.pushTokenService.getActiveByUser(userId);
        if (!tokens.length) {
          this.logger.debug(`No active push tokens for user ${userId}`);
        }
        await Promise.all(
          tokens.map((pushToken) =>
            this.pushQueue.add(
              QUEUE_NAMES.PUSH,
              {
                dispatchId,
                templateKey: dto.templateKey,
                recipientRef: pushToken.token,
                recipientId: userId,
                organizationId: dto.orgId,
                title: slots.push_title ?? '',
                body: slots.push_body ?? '',
                data: parsedPushData,
              } satisfies PushJobPayload,
              jobOpts,
            ),
          ),
        );
      }

      if (channel === NotificationChannel.SMS) {
        if (!dto.recipient.phone) {
          this.logger.warn(
            `SMS channel resolved for '${dto.templateKey}' but no phone in recipient`,
          );
          continue;
        }
        await this.smsQueue.add(
          QUEUE_NAMES.SMS,
          {
            dispatchId,
            templateKey: dto.templateKey,
            recipientRef: dto.recipient.phone,
            recipientId: userId,
            organizationId: dto.orgId,
            message: slots.sms_body ?? '',
          } satisfies SmsJobPayload,
          jobOpts,
        );
      }
    }

    this.logger.debug(
      `Dispatched '${dto.templateKey}' — dispatchId: ${dispatchId}, channels: ${channels.join(', ')}`,
    );
    return { dispatchId };
  }

  private resolveTemplateChannels(
    meta: Record<string, unknown> | null,
  ): NotificationChannel[] {
    const channelMeta = meta?.channels as Record<string, boolean> | undefined;
    if (!channelMeta) return [];
    return Object.entries(channelMeta)
      .filter(([, enabled]) => enabled)
      .map(([ch]) => ch.toUpperCase() as NotificationChannel)
      .filter((ch) => Object.values(NotificationChannel).includes(ch));
  }

  private async filterByPreferences(
    channels: NotificationChannel[],
    userId: string,
    templateKey: string,
  ): Promise<NotificationChannel[]> {
    const results = await Promise.all(
      channels.map(async (channel) => {
        const pref = await this.userSettings.getValue(
          userId,
          `notifications.${templateKey}`,
          channel.toLowerCase(),
        );
        return pref === 'false' ? null : channel;
      }),
    );
    return results.filter((ch): ch is NotificationChannel => ch !== null);
  }
}
