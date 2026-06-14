# City Link — Backend API

NestJS backend for City Link. Provides the REST API, authentication, and database layer consumed by the mobile app.

---

## Requirements

- Node.js 22+
- pnpm
- PostgreSQL
- Redis

---

## Quick Start

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
| `ADMIN_SKIP_SEED_IF_EXISTS` | Skip re-seeding admin if already present | — |

```bash
# Start with hot reload
pnpm run start:dev

# Start with debugger
pnpm run start:debug
```

Server starts on `http://localhost:2000`. API docs at `http://localhost:2000/docs`. All routes are prefixed `/api`.

---

## Commands

```bash
# Database
pnpm run db migrate dev       # run migrations (dev)
pnpm run db migrate deploy    # run migrations (production)
pnpm run db generate          # regenerate Prisma client
pnpm run db validate          # validate schema
pnpm run db studio            # open Prisma Studio
pnpm seed                     # seed database

# Auth
pnpm run auth:gen             # regenerate Better Auth schema additions

# Tests
pnpm test                     # unit tests
pnpm test:watch               # watch mode
pnpm test:e2e                 # E2E tests
pnpm test:cov                 # coverage

# Build
pnpm run build
pnpm run start:prod           # production start (after build)
pnpm run lint                 # ESLint + autofix
pnpm run format               # Prettier
```

---

## Documentation

| Topic | File |
|---|---|
| System architecture and module overview | [docs/architecture.md](docs/architecture.md) |
| Database schema, Prisma patterns, migrations | [docs/database.md](docs/database.md) |
| Authentication, guards, decorators, ACL | [docs/auth.md](docs/auth.md) |
| Notification dispatch, channels, queues, inbox | [docs/notifications.md](docs/notifications.md) |
| Template engine, slots, versioning, org overrides | [docs/templates.md](docs/templates.md) |
| Settings system (SYSTEM / ORG / USER scoping) | [docs/settings.md](docs/settings.md) |
| Transit domain — stages, routes, fleet, pricing, trips | [docs/transit.md](docs/transit.md) |
| Address hierarchy — country-agnostic geo levels | [docs/address-hierarchy.md](docs/address-hierarchy.md) |
