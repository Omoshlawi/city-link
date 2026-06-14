# Database

City Link uses **Prisma** with PostgreSQL. The schema is split into multiple `.prisma` files — one per domain — and composed automatically by `prisma.config.ts`.

---

## Multi-File Schema

```
prisma/
├── schema.prisma          # generator, datasource, AddressHierarchy model
└── models/
    ├── auth.prisma        # User, Session, Account, Organization, Team, Member, ...
    ├── routes.prisma      # Stage, StageLink, LinkPricing, Route, RouteLink, Trip
    ├── fleet.prisma       # VehicleType, Fleet, FleetRoute, Passenger, Ticket
    ├── notification.prisma# PushToken, NotificationLog, NotificationInbox
    ├── settings.prisma    # Setting
    └── templates.prisma   # Template, TemplateVersion, OrgTemplateOverride, ...
```

`prisma.config.ts` points Prisma at the `prisma/` directory (`schema: 'prisma/'`), so all `.prisma` files are composed into one schema at build/migrate time. You never need to consolidate them manually.

---

## Domain Model Files

| File | Models |
|---|---|
| `schema.prisma` | `AddressHierarchy` |
| `auth.prisma` | `User`, `Session`, `Account`, `Verification`, `Organization`, `OrganizationRole`, `Team`, `TeamMember`, `Member`, `Invitation`, `Jwks`, `TwoFactor` |
| `routes.prisma` | `Stage`, `StageLink`, `LinkPricing`, `Route`, `RouteLink`, `Trip` + enums `TraversalDirection`, `DayOfWeek` |
| `fleet.prisma` | `VehicleType`, `Passenger`, `Fleet`, `FleetRoute`, `Ticket` + enums `FleetStatus`, `PaymentStatus` |
| `notification.prisma` | `PushToken`, `NotificationLog`, `NotificationInbox` + enums `NotificationChannel`, `NotificationStatus` |
| `settings.prisma` | `Setting` + enums `SettingScope`, `SettingType` |
| `templates.prisma` | `Template`, `TemplateVersion`, `OrgTemplateOverride`, `OrgTemplateOverrideVersion` + enum `TemplateEngine` |

---

## Common Field Conventions

Every model follows these conventions:

| Field | Type | Purpose |
|---|---|---|
| `id` | `String @id @default(uuid())` | UUID primary key — portable, no auto-increment contention |
| `createdAt` | `DateTime @default(now())` | Immutable creation timestamp |
| `updatedAt` | `DateTime @updatedAt` | Auto-updated on every write |
| `voided` | `Boolean @default(false)` | Soft delete — exclude voided records with `WHERE voided = false` |

---

## Common Patterns

### Soft Deletes

Records are never hard-deleted. Set `voided = true` instead. Always filter in queries:

```ts
prisma.stage.findMany({ where: { voided: false } })
```

### UUID IDs

All primary keys are UUIDs generated client-side (`@default(uuid())`). This means IDs can be generated in application code before the DB write, which simplifies optimistic inserts.

### Named Relations

When a model has multiple relations to the same target model, Prisma requires named relations:

```prisma
startStage Stage @relation("StartStage", fields: [startStageId], references: [id])
endStage   Stage @relation("EndStage",   fields: [endStageId],   references: [id])
```

Both sides must carry the same name string.

### Enum vs Model

- Use a **Prisma enum** when the set of values is fixed and schema changes are acceptable (e.g. `FleetStatus`, `DayOfWeek`).
- Use a **model** when values are operator-configurable at runtime without a migration (e.g. `VehicleType` — operators add new vehicle types via API, not schema changes).

---

## Common Commands

```bash
# Run pending migrations in development
pnpm run db migrate dev

# Apply migrations in production (no prompt, no schema drift check)
pnpm run db migrate deploy

# Regenerate Prisma client after schema changes
pnpm run db generate

# Validate schema without generating
pnpm run db validate

# Open Prisma Studio (visual DB browser)
pnpm run db studio

# Wipe and re-apply all migrations (dev only)
pnpm run db migrate reset
```

Always run `pnpm run db generate` after any `.prisma` file change before building or starting the server.

---

## Seeding

```bash
pnpm seed
```

Seeders run in registration order from `prisma/seed/index.ts`:

1. **Admin User** — creates the admin account from `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` env vars
2. **Templates** — upserts notification templates from `prisma/seed/data/templates.csv`

### Adding a Seeder

1. Create `prisma/seed/scripts/seed-<name>.ts`:

```ts
import { PrismaClient } from '../../src/generated/prisma';

export default async function seedName(prisma: PrismaClient): Promise<void> {
  // your seed logic
}
```

2. Register it in `prisma/seed/index.ts` by adding to the `seeders` array.

CSV-based seeders can use shared utilities:

```ts
import { readCsv, buildSlots, resolveRef, parseJsonField } from '../utils/csv';
```

---

## Generated Client

The Prisma client is generated to `src/generated/prisma/`. This directory is committed to the repo so the app can build without a database connection in CI. Never edit files in `src/generated/prisma/` manually — they are overwritten on every `pnpm run db generate`.

`PrismaService` (in `src/prisma/prisma.service.ts`) wraps the generated client and is provided globally via `PrismaModule.forRoot()`.
