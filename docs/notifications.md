# Notifications

Multichannel notification dispatch for City Link. Handles delivery over **Email**, **Push**, and **SMS**, maintains a per-user **inbox feed**, and writes a full **delivery audit log** per channel per attempt.

`NotificationsModule` is `@Global()` — inject its services anywhere without importing the module.

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

`dispatchId` is a UUID generated at dispatch time. It is **not a foreign key** — it is a correlation ID that lets you join inbox entries to their delivery logs. Inbox entries can be cleared by the user without touching the audit log.

---

## Service Map

| File | Responsibility |
|---|---|
| `notifications.module.ts` | `@Global()` — wires all providers, registers BullMQ queues and Bull Board |
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
| `inbox_data` | Inbox | JSON string rendered via Handlebars, parsed into `NotificationInbox.data` for mobile deep-links |
| `push_data` | Push | JSON string rendered via Handlebars, parsed into the push job's `data` payload. Falls back to `inbox_data` if absent |
| `internal_note` | Inbox | Rendered into `internalNote` on the inbox row. Falls back to `dto.internalNote`; at least one must be provided when inbox slots are present |

**Inbox creation is slot-driven.** The dispatch service only writes a `NotificationInbox` row when both `inbox_title` and `inbox_body` are present. A pure email template with no inbox slots produces no inbox row.

### `inbox_data` — Template-Controlled Deep-Links

Declare navigation targets in the template slot, not in backend code:

```handlebars
{{! inbox_data slot }}
{"screen": "TripDetail", "tripId": "{{tripId}}"}
```

When dispatched with `data: { tripId: '4821' }`, the mobile app receives:

```json
{ "screen": "TripDetail", "tripId": "4821" }
```

Changing a screen name only requires a template update — no backend code change.

### Template `metadata` Structure

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

`inbox.visible: false` means the inbox row is created (audit trail preserved) but hidden from the user's feed. Use this for OTPs, password resets, and security alerts.

---

## Using `NotificationDispatchService`

```ts
import { NotificationDispatchService, NotificationPriority } from '../notifications/dispatch.service';

constructor(private readonly dispatch: NotificationDispatchService) {}

await this.dispatch.sendFromTemplate({
  templateKey: 'trip.started',
  recipient: {
    userId: user.id,
    email: user.email,        // required if EMAIL channel resolves
    phone: user.phoneNumber,  // required if SMS channel resolves
    // push tokens resolved automatically from push_tokens table
  },
  data: {
    routeName: 'CBD - Rongai',
    tripId: 'abc-123',
  },
  orgId: member.organizationId,
  internalNote: 'Trip started — Route CBD-Rongai',
  priority: NotificationPriority.NORMAL,
  force: false,
  visible: true,
});
```

### `SendFromTemplateDto` Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `templateKey` | `string` | Yes | Template identifier e.g. `"trip.started"` |
| `recipient.userId` | `string` | Conditional | Required for PUSH channel and preference checks |
| `recipient.email` | `string` | Conditional | Required if EMAIL channel resolves |
| `recipient.phone` | `string` | Conditional | Required if SMS channel resolves |
| `data` | `Record<string, unknown>` | Yes | Context passed to Handlebars renderer |
| `orgId` | `string` | No | Enables org-level template overrides |
| `internalNote` | `string` | Conditional | Required when template has no `internal_note` slot |
| `channels` | `NotificationChannel[]` | No | Overrides template metadata channel defaults |
| `priority` | `NotificationPriority` | No | Default: `NORMAL` |
| `force` | `boolean` | No | `true` bypasses user preferences — use for OTPs, auth events |
| `visible` | `boolean` | No | Overrides template `metadata.inbox.visible` (default: `true`) |

### Channel Resolution Order

1. Start with channels declared in `template.metadata.channels`
2. Apply `dto.channels` override if provided (full replacement)
3. If `force: false` — filter out channels where the user has opted out in Settings
4. Queue one job per resolved channel (PUSH fans out to one job per active device token)

### `NotificationPriority`

```ts
enum NotificationPriority {
  HIGH   = 1,   // auth events, OTPs, security alerts
  NORMAL = 5,   // general notifications
  LOW    = 10,  // digests, marketing
}
```

---

## User Notification Preferences

Stored in the `Setting` model:

```
scope     = USER
namespace = "notifications.{templateKey}"
key       = "{channel}"   // "email" | "push" | "sms"
value     = "false"       // opt-out
```

The dispatch service checks these automatically when `force: false`. Use `UserSettingsService` to manage preferences. Always set `force: true` for transactional notifications (OTPs, password resets).

---

## Queue Architecture

Three BullMQ queues backed by Redis:

| Queue | Processor | Provider |
|---|---|---|
| `notification-email` | `EmailNotificationProcessor` | SMTP |
| `notification-push` | `PushNotificationProcessor` | Expo |
| `notification-sms` | `SmsNotificationProcessor` | Stub (see below) |

Global job options (from `QueueModule`):
- **3 attempts** with exponential backoff: 5s → 10s → 20s
- Completed jobs retained 24 hours
- Failed jobs retained 7 days

**Per-attempt logging:** Each processor writes a `NotificationLog` row per attempt. For a job that succeeds on attempt 3:

```
attemptNumber=1  status=FAILED  error="Timeout"
attemptNumber=2  status=FAILED  error="Timeout"
attemptNumber=3  status=SENT    sentAt=...  providerMeta={receiptId: "..."}
```

**Bull Board UI** at `/admin/queues` — monitor all queues in the browser.

---

## Channel Services — Direct Use

For edge cases where you need to send without a template (e.g. OTP to an unauthenticated user):

```ts
import { EmailChannelService } from '../notifications/channels/email-channel.service';
import { PushChannelService } from '../notifications/channels/push-channel.service';
import { ISmsChannel, SMS_CHANNEL } from '../notifications/channels/channel.interface';

// Email
await this.emailChannel.send(to, subject, html);

// Push
const receiptId = await this.pushChannel.send(token, title, body, data);

// SMS (inject via token)
constructor(@Inject(SMS_CHANNEL) private readonly sms: ISmsChannel) {}
await this.sms.send(phoneNumber, message);
```

Direct channel sends do **not** write `NotificationLog` or `NotificationInbox` rows. Call `NotificationLogService.write()` explicitly if you need an audit record.

---

## Push Token Management

```
POST   /api/notifications/push-tokens       Register a device token
DELETE /api/notifications/push-tokens/:id   Void (deregister) a token
```

One user can have tokens for multiple devices. When PUSH resolves, the dispatch service fans out — one job per active token — giving per-device delivery visibility.

---

## REST Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications/inbox` | Session | List user's visible inbox notifications (paginated) |
| `PATCH` | `/notifications/inbox/:id/read` | Session | Mark one notification as read |
| `PATCH` | `/notifications/inbox/read-all` | Session | Mark all as read |
| `DELETE` | `/notifications/inbox/:id` | Session | Delete from feed |
| `POST` | `/notifications/push-tokens` | Session | Register push token |
| `DELETE` | `/notifications/push-tokens/:id` | Session | Void push token |
| `GET` | `/admin/notifications/logs` | `notifications.read` permission | Query delivery audit logs |

### Inbox Query Params

| Param | Type | Description |
|---|---|---|
| `read` | `boolean` | Filter by read status |
| `page` | `number` | Page number |
| `limit` | `number` | Items per page |
| `orderBy` | `string` | Sort field, prefix `-` for descending (default: `-createdAt`) |

---

## Adding a Real SMS Provider

The SMS channel uses `ISmsChannel` interface — swap providers by changing one line in the module:

```ts
// src/notifications/channels/africas-talking-sms.service.ts
@Injectable()
export class AfricasTalkingSmsService implements ISmsChannel {
  async send(to: string, message: string): Promise<{ messageId?: string; raw?: unknown }> {
    // call Africa's Talking / Twilio API
    return { messageId: response.messageId, raw: response };
  }
}
```

In `notifications.module.ts`:

```ts
// Before
{ provide: SMS_CHANNEL, useClass: SmsChannelService }

// After
{ provide: SMS_CHANNEL, useClass: AfricasTalkingSmsService }
```

Update the provider constant in `sms.processor.ts` to match.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `SMTP_HOST` | SMTP server hostname | `localhost` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `EMAIL_FROM` | Default sender address | `noreply@citylink.app` |
| `EXPO_ACCESS_TOKEN` | Expo push token (for higher rate limits) | — |
| `REDIS_DB_URL` | Redis URL (shared with QueueModule) | `redis://localhost:6379` |
