# Architecture

City Link backend is a NestJS monolith backed by PostgreSQL and Redis.

---

## Infrastructure

| Component | Technology |
|---|---|
| HTTP framework | NestJS (Express adapter) |
| ORM | Prisma v7 |
| Database | PostgreSQL (via `@prisma/adapter-pg`) |
| Job queues | BullMQ + Redis (`ioredis`) |
| Authentication | Better Auth (`@thallesp/nestjs-better-auth`) |
| Email | Nodemailer (`@nestjs-modules/mailer`) |
| Push notifications | Expo Server SDK |
| Validation | Zod + `nestjs-zod` |
| Config | `@itgorillaz/configify` |
| API docs | Scalar (`@scalar/nestjs-api-reference`) |

---

## Module Map

```
AppModule
├── ConfigifyModule         — environment config (@Configuration classes)
├── PrismaModule            — database client (global, injected everywhere)
├── AuthModule              — Better Auth integration (global)
├── CommonModule
│   └── QueryBuilderModule  — filtering, sorting, pagination decorators
├── AddressHierarchyModule  — geographic hierarchy CRUD
├── TemplatesModule         — notification/document templates + versioning
├── SettingsModule          — SYSTEM / ORG / USER scoped key-value store
├── QueueModule             — BullMQ queue registration + global job options
├── NotificationsModule     — dispatch, inbox, audit log, push token management (global)
├── StageModule             — Stage + StageLink (system-managed network dictionary)
├── RouteModule             — Route + RouteLink + LinkPricing (operator-managed)
├── ServiceClassModule      — QoS service class lookup table (system-managed)
└── VehicleTypeModule       — Vehicle type registry (system-managed)
```

Domain modules not yet registered in AppModule (schema defined, services pending):
- Transit: Trip
- Fleet management: Fleet, FleetRoute
- Ticketing: Passenger, Ticket

---

## Request Lifecycle

```
HTTP Request
    │
    ▼
NestJS Global Guards
    ├── JwtGuard / SessionGuard     ← resolves authenticated user from token/session
    │
    ▼
Controller (@Controller, @Get/@Post/...)
    │
    ▼
Service (business logic)
    │
    ▼
PrismaService (database)
    │
    ▼
PostgreSQL
```

All routes carry the `/api` prefix (set in `main.ts` via `app.setGlobalPrefix('api')`).

Unauthenticated routes must use `@AllowAnonymous()`. See [auth.md](auth.md) for the full decorator reference.

---

## Background Job Lifecycle

```
Service calls NotificationDispatchService.sendFromTemplate(...)
    │
    ▼
Renders template slots via Handlebars
Creates NotificationInbox row (if inbox slots present)
Queues one job per resolved channel
    │
    ├── notification-email ──► EmailNotificationProcessor ──► EmailChannelService (SMTP)
    ├── notification-push  ──► PushNotificationProcessor  ──► PushChannelService (Expo)
    └── notification-sms   ──► SmsNotificationProcessor   ──► ISmsChannel (stub / provider)
                                        │
                                        ▼
                               NotificationLog row (one per channel × attempt)
```

Each queue has 3 attempts with exponential backoff (5s → 10s → 20s). See [notifications.md](notifications.md) for full detail.

---

## Bootstrap (`main.ts`)

- `NestFactory.create(AppModule, { bodyParser: false })` — body parsing disabled at platform level (Better Auth handles its own body parsing)
- `app.setGlobalPrefix('api')` — all routes under `/api`
- Better Auth OpenAPI schema merged into Swagger document via `auth.utils.ts#mergeBetterAuthSchema`
- Scalar API reference served at `/docs` via `@scalar/nestjs-api-reference`
- Server listens on `PORT` env var (default `2000`)

---

## Configuration

Config classes use `@Configuration()` from `@itgorillaz/configify`. Each module that needs env vars declares a config class:

```ts
@Configuration()
export class AppConfig {
  @IsString()
  DATABASE_URL: string;

  @IsNumber()
  @Optional()
  PORT = 2000;
}
```

`ConfigifyModule.forRootAsync()` in `AppModule` loads and validates all config classes at startup. Missing required variables throw at boot, not at runtime.

---

## Project Structure

```
city-link/
├── src/
│   ├── main.ts                    # Bootstrap
│   ├── app.module.ts              # Root module
│   ├── app.config.ts              # App-level config
│   ├── auth/                      # Better Auth integration
│   ├── common/                    # Shared utilities, query-builder
│   │   └── query-builder/
│   ├── prisma/                    # PrismaService + module
│   ├── address-hierarchy/
│   ├── templates/
│   ├── settings/
│   ├── queue/
│   ├── notifications/
│   ├── stage/
│   └── route/
│       ├── channels/
│       ├── controllers/
│       └── processors/
├── prisma/
│   ├── schema.prisma              # Generator + datasource + AddressHierarchy
│   ├── models/                    # Domain model files (auto-composed)
│   │   ├── auth.prisma
│   │   ├── transit.prisma
│   │   ├── fleet.prisma
│   │   ├── ticketing.prisma
│   │   ├── notification.prisma
│   │   ├── settings.prisma
│   │   └── templates.prisma
│   ├── migrations/
│   └── seed/
│       ├── index.ts               # Seed runner
│       ├── scripts/               # One file per seeder
│       ├── data/                  # CSV data files
│       ├── templates/             # Handlebars template files
│       └── utils/csv.ts           # Shared CSV helpers
├── docs/                          # This documentation
└── test/                          # E2E tests
```
