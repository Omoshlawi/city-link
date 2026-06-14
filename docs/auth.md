# Authentication

Authentication is handled by [Better Auth](https://better-auth.com) via the `@thallesp/nestjs-better-auth` adapter. `AuthModule` is `@Global()` — guards and decorators are available in every module without extra imports.

---

## Active Plugins

| Plugin | Purpose |
|---|---|
| `username` | Login with username in addition to email |
| `anonymous` | Issue sessions for unauthenticated users (guest flows) |
| `admin` | Admin user management endpoints |
| `bearer` | Accept Bearer tokens in Authorization header |
| `openAPI` | Generate Better Auth's own OpenAPI schema (merged into Scalar docs) |
| `jwt` | Issue signed JWTs in addition to session cookies |
| `twoFactor` | TOTP-based 2FA with backup codes |
| `phoneNumber` | Phone-based auth (OTP via SMS) |
| `organization` | Multi-tenant organizations, teams, members, invitations, RBAC |

Plugin configuration lives in `src/auth/auth.config.ts`. To add or remove a plugin, edit that file and run `pnpm run auth:gen` to regenerate the Better Auth schema additions.

---

## Guards

Guards are applied globally via the `AuthModule`. The default for all routes is **session required**.

| Guard | When to use |
|---|---|
| `SessionGuard` | Default. Requires a valid session or JWT. |
| `JwtGuard` | Requires a JWT specifically (no session cookies). Use for mobile/API clients. |
| `OptionalSessionGuard` | Attaches session if present, but does not reject unauthenticated requests. |

You override the default guard behaviour with decorators (see below).

---

## Decorators

Import all auth decorators from `src/auth/auth.decorators.ts`.

### Access Control

```ts
@AllowAnonymous()
```
No authentication required. Route is fully public.

```ts
@OptionalAuth()
```
User is attached to the request if a valid session exists, but the route does not reject unauthenticated requests. Use for endpoints that behave differently for logged-in users (e.g. personalised feeds).

```ts
@Roles('admin', 'moderator')
```
Requires the authenticated user to have one of the specified **system-level** roles (`user.role`).

```ts
@OrgRoles('owner', 'admin')
```
Requires the authenticated user to be a member of the active organization with one of the specified **organization-level** roles (`member.role`).

```ts
@UserHasPermission({ notifications: ['read'] })
```
Fine-grained system-level ACL check. The argument is an object mapping resource names to allowed actions.

```ts
@MemberHasPermission({ reports: ['export'] })
```
Fine-grained org-level ACL check. Same shape as `@UserHasPermission` but evaluated against the user's org membership permissions.

### Current User & Org

Import from `src/common/common.decorators.ts`:

```ts
@CurrentUser()
```
Injects the authenticated `User` object into a route parameter.

```ts
@CurrentOrg()
```
Injects the active `Organization` object from the session.

#### Example

```ts
@Get('profile')
@OrgRoles('admin', 'owner')
getProfile(
  @CurrentUser() user: User,
  @CurrentOrg() org: Organization,
) {
  return { user, org };
}
```

---

## ACL System

There are two ACL layers:

### System ACL (`src/auth/auth.system.acl.ts`)

Applies globally to any user regardless of organization. Used for platform-level administration (e.g. managing all organizations, global settings, audit logs).

```ts
// Evaluated by @UserHasPermission()
{ notifications: ['read'], settings: ['write'] }
```

### Organization ACL (`src/auth/auth.org.acl.ts`)

Applies within the context of a specific organization. Used for tenant-level operations (e.g. managing the org's routes, fleet, templates).

```ts
// Evaluated by @MemberHasPermission()
{ routes: ['create', 'update'], fleet: ['read'] }
```

---

## Multi-Tenancy

The organization plugin adds a full multi-tenant model:

```
Organization
├── members   (Member — user → org with role)
├── teams     (Team — sub-group within an org)
│   └── members (TeamMember)
└── invitations (Invitation — pending member adds)
```

The active organization for a session is stored in `session.activeOrganizationId`. Use `@CurrentOrg()` to access it in controllers.

`OrganizationRole` stores custom RBAC roles per organization beyond the built-in `owner`/`admin`/`member` roles.

---

## Regenerating the Auth Schema

When you add or remove Better Auth plugins, the auth schema must be regenerated:

```bash
pnpm run auth:gen
```

This reads `src/auth/auth.cli.config.ts` and updates the Prisma auth models. After running, always follow up with:

```bash
pnpm run db generate     # update Prisma client
pnpm run db migrate dev  # apply schema changes
```

---

## Lifecycle Hooks

`src/auth/auth.hooks.ts` contains Better Auth lifecycle hooks (e.g. `onSignUp`, `onSessionCreate`). Use these to run side effects on auth events (sending welcome emails, creating default settings, etc.) without coupling the auth config to domain services.
