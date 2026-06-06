# City Link — Backend API

NestJS backend for City Link. Provides the REST API, authentication, and database layer consumed by the mobile app.

---

## Requirements

- Node.js 22+
- pnpm
- PostgreSQL
- Redis

---

## Setup

```bash
pnpm install
```

Copy `.env.example` to `.env` and fill in the required values:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection string | — |
| `PORT` | HTTP port | `2000` |
| `BETTER_AUTH_URL` | Public base URL of this server | `http://localhost:2000` |
| `FRONTEND_URL` | Mobile/web app base URL (used in email links) | `http://localhost:8000` |
| `ADMIN_EMAIL` | Seed admin email | — |
| `ADMIN_USERNAME` | Seed admin username | — |
| `ADMIN_PASSWORD` | Seed admin password | — |
| `ADMIN_SKIP_SEED_IF_EXISTS` | Set to `true` to skip re-seeding admin if already present | — |

---

## Development

```bash
# Start with hot reload
pnpm run start:dev

# Start with debugger
pnpm run start:debug
```

Server starts on `http://localhost:2000` (or `PORT`).  
API docs (Scalar) available at `http://localhost:2000/docs`.  
All routes are prefixed with `/api`.

---

## Database

The project uses **Prisma** with a multi-file schema (`prisma/models/`). Each domain has its own `.prisma` file.

```bash
# Run migrations (dev)
pnpm run db migrate dev

# Run migrations (production)
pnpm run db migrate deploy

# Open Prisma Studio
pnpm run db studio

# Validate schema
pnpm run db validate

# Regenerate Better Auth schema additions
pnpm run auth:gen
```

### Seeding

```bash
pnpm seed
```

Seeders run in order:

1. **Admin User** — creates the admin account from env vars
2. **Templates** — upserts notification templates from `prisma/seed/data/templates.csv`

#### Adding a new seeder

1. Create `prisma/seed/scripts/seed-<name>.ts` — export a default `async function(prisma: PrismaClient): Promise<void>`
2. Register it in `prisma/seed/index.ts` by adding to the `seeders` array

CSV-based seeders can use the shared utilities from `prisma/seed/utils/csv.ts`:

```ts
import { readCsv, buildSlots, resolveRef, parseJsonField } from '../utils/csv';
```

---

## Testing

```bash
# Unit tests
pnpm test

# Unit tests in watch mode
pnpm test:watch

# Run a single test file
pnpm test -- --testPathPattern=<file>

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

---

## Other commands

```bash
# Build
pnpm run build

# Production start (after build)
pnpm run start:prod

# Lint + autofix
pnpm run lint

# Format
pnpm run format
```

---

## Project structure

```
src/
├── auth/           # Better Auth integration, guards, decorators, ACL
├── common/         # Shared utilities, types, query-builder
├── prisma/         # PrismaService, module, config
└── main.ts         # Bootstrap — Swagger/Scalar docs wired here

prisma/
├── models/         # Multi-file Prisma schema (one file per domain)
│   ├── schema.prisma   # generator + datasource
│   ├── auth.prisma
│   └── templates.prisma
├── migrations/
└── seed/
    ├── index.ts        # Seed runner
    ├── scripts/        # One file per seeder
    ├── data/           # CSV data files
    ├── templates/      # Handlebars template files referenced by CSV
    └── utils/csv.ts    # Shared CSV helpers
```

---

## Authentication

Authentication is handled by [Better Auth](https://better-auth.com) via `@thallesp/nestjs-better-auth`.

Active plugins: `username`, `anonymous`, `admin`, `bearer`, `openAPI`, `jwt`, `twoFactor`, `phoneNumber`, `organization`.

All routes are protected by default. Use decorators from `src/auth/auth.decorators.ts` to adjust access:

```ts
@AllowAnonymous()   // no auth required
@OptionalAuth()     // session attached if present, not required
@Roles(['admin'])   // system-level role check (user.role)
@OrgRoles(['owner', 'admin'])  // org member role check
@UserHasPermission({ permission: { resource: ['action'] } })
@MemberHasPermission({ permissions: { resource: ['action'] } })
```
