# Templates

The templates system manages reusable content templates for notifications, documents, and any other slot-based content. Templates support versioning and per-organization overrides.

---

## Core Concepts

| Concept | Model | Description |
|---|---|---|
| Template | `Template` | The base definition — slots, schema, metadata, engine |
| Version | `TemplateVersion` | Immutable snapshot created on every save |
| Org Override | `OrgTemplateOverride` | Per-org slot customizations without forking the base |
| Override Version | `OrgTemplateOverrideVersion` | Immutable snapshot of each org override save |

---

## The `Template` Model

```
Template
├── key         String @unique     — unique identifier e.g. "trip.started"
├── type        String             — category e.g. "notification", "document"
├── name        String             — human-readable display name
├── slots       Json               — the content map (slot name → template string)
├── schema      Json               — JSON Schema validating the `data` object at dispatch time
├── metadata    Json               — channel defaults, inbox visibility
├── engine      TemplateEngine     — rendering engine (currently HANDLEBARS)
└── version     Int                — counter incremented on every save
```

### `slots`

A JSON object where keys are slot names and values are Handlebars template strings:

```json
{
  "email_subject": "Your trip has started",
  "email_body": "<p>Hi {{name}}, your trip on {{routeName}} has started.</p>",
  "push_title": "Trip started",
  "push_body": "{{routeName}} — tap to view",
  "inbox_title": "Trip started",
  "inbox_body": "Your trip on {{routeName}} is underway.",
  "inbox_data": "{\"screen\": \"TripDetail\", \"tripId\": \"{{tripId}}\"}"
}
```

Only define the slots a template actually uses. See [notifications.md](notifications.md) for the full slot reference.

### `schema`

JSON Schema used to validate the `data` object passed at dispatch time. Prevents runtime rendering failures from missing context variables:

```json
{
  "type": "object",
  "required": ["name", "routeName", "tripId"],
  "properties": {
    "name":      { "type": "string" },
    "routeName": { "type": "string" },
    "tripId":    { "type": "string" }
  }
}
```

### `metadata`

Controls default channel enablement and inbox visibility:

```json
{
  "channels": {
    "email": true,
    "push": true,
    "sms": false
  },
  "inbox": {
    "visible": true
  }
}
```

### `engine`

```ts
enum TemplateEngine {
  HANDLEBARS
}
```

The `TemplateEngine` enum is extensible — add new engines (Mustache, Liquid, etc.) without changing calling code.

---

## Rendering

`TemplateRendererService` compiles and renders slots via Handlebars:

```ts
const rendered = await this.renderer.render(template, data, orgId);
// rendered.slots → { email_subject: "...", email_body: "...", ... }
```

When an `orgId` is provided, the renderer applies `OrgTemplateOverride` slot values before rendering, so org-specific content replaces base content automatically.

---

## Versioning

Every save to a `Template` creates an immutable `TemplateVersion` snapshot:

```
TemplateVersion
├── templateId   — parent template
├── slots        — snapshot of slots at this version
├── changedBy    — User who made the change
└── createdAt    — when this version was created
```

The `Template.version` counter increments on each save. To see what a template looked like at a previous version, query `TemplateVersion` ordered by `createdAt`.

Versions are never deleted. This means you always have a full audit history of every content change.

---

## Org Overrides

Organizations can customize specific slots without forking the entire template:

```
OrgTemplateOverride
├── organizationId  — which org
├── templateKey     — which template (references Template.key)
├── slots           — only the slots being overridden (merged over base slots)
└── version         — counter for this override's history
```

Example: the base template has `email_subject: "Your trip has started"`. An org override sets `email_subject: "Karibu — safari yako imeanza"`. All other slots remain from the base template.

Override history is tracked in `OrgTemplateOverrideVersion` — same shape as `TemplateVersion`.

---

## REST Endpoints

Templates are managed via `TemplatesModule` controllers. Common operations:

| Method | Path | Description |
|---|---|---|
| `GET` | `/templates` | List all templates |
| `GET` | `/templates/:key` | Get template by key |
| `POST` | `/templates` | Create template |
| `PATCH` | `/templates/:key` | Update template (creates new version) |
| `GET` | `/templates/:key/versions` | List version history |
| `GET` | `/org-template-overrides` | List org's overrides |
| `PUT` | `/org-template-overrides/:key` | Upsert override for a template key |

---

## Seeding Templates

Templates are seeded from `prisma/seed/data/templates.csv` using the CSV seed utilities:

```ts
import { readCsv, buildSlots, resolveRef, parseJsonField } from '../utils/csv';
```

The CSV format maps column headers to template fields. Slot content that is too long for a CSV cell can be referenced from a file in `prisma/seed/templates/` via a `ref:` prefix in the CSV value.

To add a new template, add a row to `templates.csv` (and corresponding template files if needed), then run `pnpm seed`.
