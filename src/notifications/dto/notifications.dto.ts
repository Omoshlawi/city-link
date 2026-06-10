import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import {
  NotificationChannel,
  NotificationStatus,
} from '../../generated/prisma/client';
import { QueryBuilderSchema } from '../../common/query-builder';
import dayjs from 'dayjs';

// ── Push token ────────────────────────────────────────────────────────────────

const RegisterPushTokenSchema = z.object({
  token: z.string().min(1),
  provider: z.string().min(1), // "expo" | "fcm" | "apns"
  platform: z.string().optional(),
  deviceId: z.string().optional(),
});

export class RegisterPushTokenDto extends createZodDto(
  RegisterPushTokenSchema,
) {}

// ── Inbox ─────────────────────────────────────────────────────────────────────

const QueryInboxSchema = z.object({
  ...QueryBuilderSchema.shape,
  read: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional(),
});

export class QueryInboxDto extends createZodDto(QueryInboxSchema) {}

// ── Admin log query ───────────────────────────────────────────────────────────

const QueryNotificationLogsSchema = z.object({
  ...QueryBuilderSchema.shape,
  provider: z.string().optional(),
  status: z.enum(NotificationStatus).optional(),
  channel: z.enum(NotificationChannel).optional(),
  templateKey: z.string().optional(),
  recipientId: z.string().optional(),
  dateFrom: z.iso
    .date()
    .optional()
    .transform((data) => dayjs(data).toDate()),
  dateTo: z.iso
    .date()
    .optional()
    .transform((data) => dayjs(data).toDate()),
});

export class QueryNotificationLogsDto extends createZodDto(
  QueryNotificationLogsSchema,
) {}
