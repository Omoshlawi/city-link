# Notifications Module

Multichannel notification dispatch for City Link. Handles delivery over **Email**, **Push**, and **SMS**, maintains a per-user **inbox feed**, and writes a full **delivery audit log** per channel per attempt.

---

## Architecture

Every notification goes through two layers:

```
Caller
  │
  ▼
NotificationDispatchService          ← renders template, writes inbox, queues jobs
  │
  ├── NotificationInbox row           ← ONE per dispatch (umbrella intent)
  │
  ├── notification:email queue ──► EmailNotificationProcessor ──► NotificationLog (EMAIL, attempt N)
  ├── notification:push queue  ──► PushNotificationProcessor  ──► NotificationLog (PUSH,  attempt N)
  └── notification:sms queue   ──► SmsNotificationProcessor   ──► NotificationLog (SMS,   attempt N)
```

| Layer | Model | One row per | Purpose |
|---|---|---|---|
| Intent | `NotificationInbox` | dispatch | What the user sees in their app feed |
| Delivery | `NotificationLog` | channel × attempt | Audit trail and retry visibility |

`dispatchId` is a UUID generated at dispatch time. It is **not a foreign key** — it is a correlation ID that lets you join inbox entries to their delivery logs. This means inbox entries can be cleared by the user without touching the audit log, and log rows can exist for dispatches with no inbox entry (e.g. OTPs with `visible: false`).

### Service map

| File | Responsibility |
|---|---|
| `notifications.module.ts` | `@Global()` — wires all providers, registers BullMQ queues and BullBoard |
| `notifications.config.ts` | SMTP + Expo env vars via `@Configuration()` |
| `notifications.constants.ts` | `QUEUE_NAMES`, `NOTIFICATION_PROVIDERS`, `NotificationPriority` |
| `dispatch.service.ts` | Main entry point — renders template, resolves channels, writes inbox, queues jobs |
| `inbox.service.ts` | CRUD for `NotificationInbox` — list, mark read, delete |
| `log.service.ts` | Write per-attempt log rows; admin query |
| `push-token.service.ts` | Register, void, and list push tokens per user |
| `channels/email-channel.service.ts` | Wraps `@nestjs-modules/mailer` |
| `channels/push-channel.service.ts` | Wraps Expo Server SDK |
| `channels/sms-channel.service.ts` | Stub — logs warning, returns `{}` |
| `channels/channel.interface.ts` | `ISmsChannel` interface + `SMS_CHANNEL` injection token |
| `processors/email.processor.ts` | BullMQ worker for `notification-email` |
| `processors/push.processor.ts` | BullMQ worker for `notification-push` |
| `processors/sms.processor.ts` | BullMQ worker for `notification-sms` |

---

## Template Slot Conventions

Templates are managed via the `TemplatesModule`. A template's `slots` object can contain any combination of the following well-known keys. Only define the slots a template actually uses.

| Slot | Channel | Description |
|---|---|---|
| `email_subject` | Email | Rendered subject line |
| `email_body` | Email | Rendered HTML body |
| `push_title` | Push | Notification title |
| `push_body` | Push | Notification body text |
| `sms_body` | SMS | Plain-text message |
| `inbox_title` | Inbox | Title shown in the app notification feed |
| `inbox_body` | Inbox | Body shown in the app notification feed |
| `inbox_data` | Inbox | **JSON string** — rendered via Handlebars, parsed into `NotificationInbox.data` for mobile deep-links |
| `push_data` | Push | **JSON string** — rendered via Handlebars, parsed into the push job's `data` payload. Falls back to `inbox_data` if absent |
| `internal_note` | Inbox | Handlebars string rendered into `internalNote` on the inbox row. Falls back to `dto.internalNote`; at least one must be provided when inbox slots are present |

**Inbox creation is slot-driven.** The dispatch service only writes a `NotificationInbox` row when both `inbox_title` and `inbox_body` are present in the rendered output. A pure email template with no inbox slots produces no inbox row.

### `inbox_data` — template-controlled deep-links

Instead of hardcoding navigation targets in backend code, declare them in the template slot. The slot is rendered as a Handlebars template and the result is `JSON.parse()`d:

```handlebars
{{! Template: shipment.arrived_at_station — inbox_data slot }}
{"screen": "ShipmentDetail", "tripId": "{{tripId}}", "stationId": "{{stationId}}"}
```

When dispatched with `data: { tripId: '4821', stationId: 'stn-abc' }`, the mobile app receives:

```json
{ "screen": "ShipmentDetail", "tripId": "4821", "stationId": "stn-abc" }
```

Mobile app navigation structure changes → update the template only, no backend code change.

### Template `metadata` structure

The `metadata` JSON field on a template controls default channel enablement and inbox visibility:

```json
{
  "channels": {
    "email": true,
    "push": true,
    "sms": false
  },
  "inbox": {
    "visible": false
  }
}
```

`inbox.visible: false` means the inbox row is created (audit trail preserved) but hidden from the user's notification feed. Use this for OTPs, password resets, and security alerts.

---

## Using `NotificationDispatchService`

The dispatch service is `@Global()` — inject it directly without importing `NotificationsModule`.

```ts
import { NotificationDispatchService, NotificationPriority } from '../notifications/dispatch.service';

constructor(private readonly dispatch: NotificationDispatchService) {}

await this.dispatch.sendFromTemplate({
  templateKey: 'shipment.arrived_at_station',
  recipient: {
    userId: user.id,
    email: user.email,        // required if EMAIL channel resolves
    phone: user.phoneNumber,  // required if SMS channel resolves
    // push tokens resolved automatically from push_tokens table
  },
  data: {
    station: 'Nairobi CBD',
    tripId: '4821',
    stationId: 'stn-abc',
  },
  orgId: member.organizationId,    // optional — enables org template overrides
  internalNote: 'User arrived at Station A — Trip #4821',  // omit if template has internal_note slot
  priority: NotificationPriority.NORMAL,
  force: false,   // respect user preferences
  visible: true,  // show in user's notification feed
});
```

### `SendFromTemplateDto` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `templateKey` | `string` | Yes | Template identifier e.g. `"auth.email.verification"` |
| `recipient.userId` | `string` | Conditional | Required for PUSH channel and preference checks |
| `recipient.email` | `string` | Conditional | Required if EMAIL channel resolves |
| `recipient.phone` | `string` | Conditional | Required if SMS channel resolves |
| `data` | `Record<string, unknown>` | Yes | Context passed to Handlebars renderer |
| `orgId` | `string` | No | Enables org-level template overrides |
| `internalNote` | `string` | Conditional | Audit description stored on the inbox row, never shown to user. Optional when the template defines an `internal_note` slot; required otherwise |
| `channels` | `NotificationChannel[]` | No | Overrides template metadata channel defaults |
| `priority` | `NotificationPriority` | No | Default: `NORMAL` |
| `force` | `boolean` | No | Default: `false` — when `true`, bypasses user preferences |
| `visible` | `boolean` | No | Overrides template `metadata.inbox.visible` (default: `true`) |

### Channel resolution order

1. Start with channels declared in `template.metadata.channels`
2. Apply `dto.channels` override if provided (full replacement)
3. If `force: false` — filter out channels where the user has opted out in Settings
4. Queue one job per resolved channel (PUSH fans out to one job per active device token)

### `NotificationPriority`

```ts
enum NotificationPriority {
  HIGH   = 1,   // auth events, OTPs, security alerts — processed first
  NORMAL = 5,   // general notifications
  LOW    = 10,  // digests, marketing
}
```

---

## User Notification Preferences

User channel preferences are stored in the `Setting` model:

```
scope    = USER
namespace = "notifications.{templateKey}"
key       = "{channel}"           // "email" | "push" | "sms"
value     = "false"               // opt-out
```

Example — a user opting out of push notifications for `shipment.arrived_at_station`:

```
scope=USER  namespace="notifications.shipment.arrived_at_station"  key="push"  value="false"
```

The dispatch service checks these automatically when `force: false`. Use the existing `UserSettingsService` to manage preferences from other modules. Set `force: true` for transactional notifications that must always be delivered (OTPs, password resets).

---

## Channel Services — Direct Use

Channel services are exported from `NotificationsModule` for edge cases where you need to send without a template (e.g. an OTP to an unauthenticated user who has no `userId`):

```ts
import { EmailChannelService } from '../notifications/channels/email-channel.service';
import { PushChannelService } from '../notifications/channels/push-channel.service';
import { ISmsChannel, SMS_CHANNEL } from '../notifications/channels/channel.interface';

// Email
await this.emailChannel.send(to, subject, html);

// Push (returns Expo receipt ID or null)
const receiptId = await this.pushChannel.send(token, title, body, data);

// SMS (inject via token)
constructor(@Inject(SMS_CHANNEL) private readonly sms: ISmsChannel) {}
await this.sms.send(phoneNumber, message);
```

**Note:** Direct channel sends do **not** write `NotificationLog` or `NotificationInbox` rows. Use `NotificationLogService.write()` explicitly if you need an audit record for a manual send.

---

## Push Token Management

Push tokens are registered by the mobile app when it receives an Expo/FCM push token. One user can have tokens for multiple devices.

```
POST   /api/notifications/push-tokens          Register a token
DELETE /api/notifications/push-tokens/:id      Void (deregister) a token
```

**Fan-out:** When PUSH is a resolved channel, the dispatch service calls `PushTokenService.getActiveByUser(userId)` and queues **one job per active token**. Each job produces an independent `NotificationLog` row, giving full per-device delivery visibility.

---

## REST Endpoints

All routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications/inbox` | Session | List user's visible inbox notifications (paginated) |
| `PATCH` | `/notifications/inbox/:id/read` | Session | Mark one notification as read |
| `PATCH` | `/notifications/inbox/read-all` | Session | Mark all notifications as read |
| `DELETE` | `/notifications/inbox/:id` | Session | Delete a notification from the feed |
| `POST` | `/notifications/push-tokens` | Session | Register a push token |
| `DELETE` | `/notifications/push-tokens/:id` | Session | Void a push token |
| `GET` | `/admin/notifications/logs` | Permission: `notifications.read` | Query delivery logs (filter by provider, status, templateKey, recipientId, date range) |

### Inbox query params

| Param | Type | Description |
|---|---|---|
| `read` | `boolean` | Filter by read status |
| `page` | `number` | Page number |
| `limit` | `number` | Items per page |
| `orderBy` | `string` | Sort field, prefix `-` for descending (default: `-createdAt`) |

---

## Queue Architecture

Three BullMQ queues backed by Redis:

| Queue | Workers | Provider |
|---|---|---|
| `notification-email` | `EmailNotificationProcessor` | `smtp` (configurable) |
| `notification-push` | `PushNotificationProcessor` | `expo` |
| `notification-sms` | `SmsNotificationProcessor` | `stub` |

All queues inherit the global job options from `QueueModule`:
- **3 attempts** with exponential backoff: 5s → 10s → 20s
- Completed jobs retained 24 hours
- Failed jobs retained 7 days

**Per-attempt logging:** Each processor writes a `NotificationLog` row for every attempt, whether it succeeds or fails. The processor rethrows on failure so BullMQ handles the retry. This means for a job that ultimately succeeds on attempt 3, you get three rows:

```
attemptNumber=1  status=FAILED   error="Timeout"   failedAt=...
attemptNumber=2  status=FAILED   error="Timeout"   failedAt=...
attemptNumber=3  status=SENT     sentAt=...        providerMeta={receiptId: "..."}
```

**Bull Board UI** — all three queues are visible at `/admin/queues`.

---

## Adding a Real SMS Provider

The SMS channel is behind `ISmsChannel` interface so swapping providers requires no changes to dispatch or processor logic.

1. **Implement the interface:**

```ts
// src/notifications/channels/africas-talking-sms.service.ts
import { Injectable } from '@nestjs/common';
import { ISmsChannel } from './channel.interface';

@Injectable()
export class AfricasTalkingSmsService implements ISmsChannel {
  async send(to: string, message: string): Promise<{ messageId?: string; raw?: unknown }> {
    // ... call Africa's Talking API
    return { messageId: response.messageId, raw: response };
  }
}
```

2. **Swap the provider in `notifications.module.ts`:**

```ts
// Before
{ provide: SMS_CHANNEL, useClass: SmsChannelService }

// After
{ provide: SMS_CHANNEL, useClass: AfricasTalkingSmsService }
```

3. **Update the provider constant in `sms.processor.ts`:**

```ts
provider: NOTIFICATION_PROVIDERS.AFRICAS_TALKING,  // was STUB
```

---

## Environment Variables

| Variable | Description | Default | Required |
|---|---|---|---|
| `SMTP_HOST` | SMTP server hostname | `localhost` | No |
| `SMTP_PORT` | SMTP server port | `587` | No |
| `SMTP_USER` | SMTP authentication username | — | No |
| `SMTP_PASS` | SMTP authentication password | — | No |
| `EMAIL_FROM` | Default sender address | `noreply@citylink.app` | No |
| `EXPO_ACCESS_TOKEN` | Expo push access token (for higher rate limits) | — | No |
| `REDIS_DB_URL` | Redis connection URL (shared with QueueModule) | `redis://localhost:6379` | Production |

---

## Design Decisions

| Decision | Rationale |
|---|---|
| `dispatchId` is a correlation UUID, not a FK | Inbox and log have independent lifecycles — users can clear their feed without affecting the audit trail; processors can write logs for dispatches with no inbox entry |
| `IN_APP` removed from `NotificationChannel` | The inbox is the umbrella intent record, not a delivery channel. It's created by the dispatch service, not a queue processor |
| `provider` on `NotificationLog` is `String` | New providers (Africa's Talking, Sendgrid, etc.) can be added without a DB migration |
| `@@unique([dispatchId, channel, recipientRef, attemptNumber])` | Push fan-out creates one log row per device token — `recipientRef` (the token) is needed to make each row unique |
| Inbox creation is slot-driven | Not every notification belongs in the user's feed (OTPs, security alerts). Templates opt in by defining `inbox_title` + `inbox_body` slots |
| `visible=false` hides from feed but preserves audit row | OTPs and password reset emails should not appear in the user's notification history, but the dispatch record is still useful for ops debugging |
| `inbox_data` is a Handlebars slot, not a dispatch parameter | Mobile app navigation targets are declared in the template, not the backend caller — changing a screen name only requires a template update |
| SMS behind `ISmsChannel` interface | Provider can be swapped (stub → Africa's Talking → Twilio) by changing one line in the module, with zero impact on dispatch or processor code |
| `push_data` slot falls back to `inbox_data` | Most templates navigate to the same screen from both a push tap and an inbox tap, so one slot suffices. Templates that need different payloads (e.g. background processing data vs deep-link) define `push_data` explicitly |
| `internal_note` slot is optional | When the note is fully determined by template context (e.g. "User arrived at {{station}}"), declaring it in the template avoids forcing every call site to re-derive the same string |
