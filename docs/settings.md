# Settings

The settings system provides a multi-scope key-value store for runtime configuration. Every setting is a single atomic value, stored as a string and typed by `SettingType`.

---

## Scopes

| Scope | Owner | Examples |
|---|---|---|
| `SYSTEM` | Platform | Default locale, theme, global feature flags |
| `ORGANIZATION` | An org | Org-specific notification preferences, timezone |
| `USER` | A user | Dashboard layout, personal notification opt-outs |

The scope determines which service manages the setting and what context (userId, organizationId) is required.

---

## The `Setting` Model

```
Setting
├── scope           SettingScope      — SYSTEM | ORGANIZATION | USER
├── namespace       String            — logical grouping e.g. "notifications"
├── key             String            — setting name e.g. "email"
├── value           String            — the value (always a string)
├── type            SettingType       — how to interpret the value
├── userId          String?           — required when scope = USER
└── organizationId  String?           — required when scope = ORGANIZATION
```

### Unique Constraint

`@@unique([scope, namespace, key, userId, organizationId])` — one value per scope + namespace + key + owner combination.

### `SettingType`

| Type | Value interpretation |
|---|---|
| `STRING` | Plain string |
| `BOOLEAN` | `"true"` / `"false"` |
| `INTEGER` | Integer string e.g. `"42"` |
| `FLOAT` | Float string e.g. `"3.14"` |
| `JSON` | JSON-encoded string, parsed before use |
| `ENCRYPTED` | Encrypted at rest, decrypted on read |

---

## Services

| Service | Scope it manages |
|---|---|
| `SystemSettingsService` | `SYSTEM` |
| `OrgSettingsService` | `ORGANIZATION` |
| `UserSettingsService` | `USER` |
| `SettingsQueryService` | Cross-scope queries and helpers |

---

## Namespace + Key Convention

Use dot-separated or slash-separated namespaces to group related settings:

```
namespace="locale"          key="default"           → default locale e.g. "en-KE"
namespace="theme"           key="default"           → "dark" or "light"
namespace="notifications"   key="email"             → "true" or "false"
namespace="notifications"   key="quiet_start"       → "22" (hour)
namespace="notifications"   key="timezone"          → "Africa/Nairobi"
namespace="dashboard"       key="cols"              → "3"
namespace="dashboard"       key="widgets"           → "[\"revenue\",\"trips\"]"
```

---

## Notification User Preferences

The dispatch system reads user preferences from Settings to respect channel opt-outs. The convention is:

```
scope     = USER
namespace = "notifications.{templateKey}"
key       = "{channel}"     // "email" | "push" | "sms"
value     = "false"         // the user has opted out of this channel for this template
```

Example — a user opting out of push notifications for the `trip.started` template:

```
scope=USER  namespace="notifications.trip.started"  key="push"  value="false"
```

To manage this from code, use `UserSettingsService`:

```ts
await this.userSettings.set(
  userId,
  'notifications.trip.started',
  'push',
  'false',
  SettingType.BOOLEAN,
);
```

The notification dispatch service checks these automatically when `force: false`. See [notifications.md](notifications.md) for the full dispatch flow.

---

## REST Endpoints

Settings are exposed via three controller groups, each covering one scope:

| Prefix | Scope | Auth |
|---|---|---|
| `/system-settings` | SYSTEM | Admin role |
| `/org-settings` | ORGANIZATION | Org admin role |
| `/user-settings` | USER | Current user |

Each group supports standard CRUD (get by namespace+key, upsert, delete).
