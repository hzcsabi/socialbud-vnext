# Codebase map

A short "where things live" guide. Paths are relative to the repo root.

---

## apps/web structure

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Logged-in product app (route group)
│   │   ├── layout.tsx      # Auth + profile + account check; sidebar; redirects
│   │   └── app/            # App pages (Assistant, Calendar, Posts, Settings, etc.)
│   │       ├── account/
│   │       ├── campaigns/
│   │       ├── clips/
│   │       ├── comments/
│   │       ├── image-gallery/
│   │       ├── posts/
│   │       ├── settings/   # + actions.ts, users/actions.ts
│   │       └── ...
│   ├── (admin)/            # Admin area (route group)
│   │   └── admin/
│   │       ├── layout.tsx  # Thin wrapper
│   │       ├── login/
│   │       └── (main)/    # Sidebar + nav; gated by admins table
│   │           ├── layout.tsx
│   │           ├── users/  # User/account admin: page, actions/, buttons/modals
│   │           ├── team-access/
│   │           ├── corporations/
│   │           ├── analytics/
│   │           └── ...
│   ├── api/                # API routes
│   │   ├── auth/signout/route.ts
│   │   ├── auth/signout-deleted/route.ts
│   │   └── jobs/enqueue/route.ts
│   ├── auth/               # Auth pages (callback, set-password, oauth-callback)
│   ├── login/
│   ├── signup/
│   ├── onboarding/
│   ├── select-account/
│   ├── invite/accept/
│   ├── forgot-password/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # Reusable UI (e.g. components/ui/)
├── lib/                    # Shared app code
│   ├── supabase/           # server.ts, server-admin.ts, middleware.ts, browser.ts
│   ├── supabase-admin.ts   # updateUserBannedUntil helper
│   ├── account.ts          # ensureCurrentUserAccount, listUserAccounts, getCurrentUserAccount, setSelectedAccount
│   ├── account-constants.ts
│   ├── admin.ts            # getAdminUser()
│   ├── roles.ts
│   ├── email.ts
│   ├── app-url.ts
│   └── utils.ts
└── middleware.ts          # Delegates to updateSession (Supabase)
```

---

## apps/brain structure

```
apps/brain/src/
├── index.ts    # Fastify: GET /health, POST /jobs/enqueue
├── worker.ts   # Polling loop: claimNextJob → executeJob → completeJob/failJob
├── migrate.ts # Runs @socialbud/db schema SQL (jobs + other tables)
└── env.ts     # Brain env validation (DATABASE_URL, PORT, etc.)
```

---

## packages/db

- **client.ts** — `createDbClient(connectionString)` (pg Pool).
- **jobs.ts** — `enqueueJob`, `claimNextJob`, `completeJob`, `failJob`; table name and types.
- **schema/** — Tables: `jobs`, `accounts`, `account_members`, `profiles`, `billing_accounts`, `account_billing`, `subscriptions`. Each file exports `create*TableSql`, RLS SQL where applicable, and TypeScript types. Used by brain and migrate; not by web.

---

## packages/domain

- **index.ts** — Re-exports from `jobs.ts`.
- **jobs.ts** — `executeJob(ctx)`, `JobContext` type. Single default handler (log only). Add job-type branches here (or delegate) when implementing real jobs.

---

## packages/shared

- **jobs.ts** — `enqueueJobBodySchema` (Zod), `EnqueueJobBody`.
- **env.ts** — Env validation (if used).
- **index.ts** — Exports the above. Used by web (enqueue route) and brain.

---

## packages/services

- **accounts/ensure-user-account.ts** — `ensureUserAccount(supabase, userId)`.
- **index.ts** — Re-exports. Used by web only (onboarding, lib/account.ts).

---

## Quick lookup

| Task | Location |
|------|----------|
| **Add a new page** | `apps/web/src/app/(app)/app/<name>/page.tsx` (app) or `apps/web/src/app/(admin)/admin/(main)/<name>/page.tsx` (admin). Add nav link in the corresponding layout. |
| **Add a new admin feature** | Under `apps/web/src/app/(admin)/admin/(main)/` (e.g. new folder + `page.tsx`, `actions.ts`). Use `getAdminUser()` and service-role Supabase where needed. |
| **Add a background job** | 1) Enqueue: call `POST /api/jobs/enqueue` from web (or use same schema from `@socialbud/shared`). 2) Handler: extend `executeJob` in `packages/domain/src/jobs.ts` (or delegate by `ctx.type`). 3) Worker already runs all jobs via `executeJob`. |
| **Add shared helpers** | App-only: `apps/web/src/lib/`. Cross-app + used by brain: `packages/shared` or `packages/services` (if server-side, Supabase-aware). |
| **Supabase helpers** | User-scoped client: `@/lib/supabase/server` (`createClient()`). Service role: `@/lib/supabase/server-admin` (`createServiceRoleClient()`). Auth helper: `@/lib/supabase-admin` (e.g. `updateUserBannedUntil`). |
| **Admin auth** | `@/lib/admin.ts` — `getAdminUser()`. Layout in `(admin)/(main)/layout.tsx` checks it and redirects non-admins. |
| **Migrations** | Supabase schema: `supabase/migrations/*.sql`. Jobs (and any schema from packages/db): run `pnpm --filter @socialbud/brain run migrate` (uses `DATABASE_URL`). |
