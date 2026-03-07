# Architecture

## High-level diagram

```
Browser
  ↓
Next.js (apps/web) — port 3000
  ↓
  ├─ Supabase (auth + Postgres data: profiles, accounts, account_members, admins, etc.)
  └─ Brain service (apps/brain) — port 3001 — for background jobs only
       ↓
  POST /jobs/enqueue → Brain inserts into jobs table (Postgres)
       ↓
  Worker process (same codebase, separate process) polls jobs table, runs executeJob from @socialbud/domain
```

The web app is the main product. It talks to **Supabase only** for auth and all app data. It does **not** use `@socialbud/db` or `@socialbud/domain`. The brain is a small Fastify server plus a polling worker used only for background jobs.

---

## Main runtime components

| Component | What it is | Role |
|-----------|------------|------|
| **apps/web** | Next.js 15 app | Main product: auth, onboarding, account selection, app UI (`/app/*`), admin UI (`/admin/*`). Uses Supabase (cookie-based auth, RLS). Server actions and RSC do data access and business logic. |
| **apps/brain** | Fastify server (HTTP) | Exposes `GET /health` and `POST /jobs/enqueue`. Inserts jobs into a Postgres `jobs` table. Does not serve the product. |
| **Brain worker** | Node process running `worker.ts` | Polls the `jobs` table, claims a job, calls `executeJob()` from `@socialbud/domain`, marks job complete/failed. Run separately: `pnpm --filter @socialbud/brain run dev:worker`. |
| **Supabase** | Auth + Postgres | All user auth, sessions (cookies), and app data (profiles, accounts, account_members, admins, invitations, etc.). Web uses anon key + service role (server-only) where needed. |

---

## Request flow

- **Page / server action:** Browser → Next.js → `createClient()` (Supabase server client with cookies) or `createServiceRoleClient()` for admin/backend-only paths → Supabase (auth + Postgres). No brain involved.
- **Enqueue job:** Client or server calls `POST /api/jobs/enqueue` (Next.js). That route validates the user (Supabase), then proxies to `BRAIN_URL/jobs/enqueue`. Brain inserts into the `jobs` table (using `@socialbud/db` and `DATABASE_URL`). The worker, which uses the same `DATABASE_URL`, polls and runs the job via `@socialbud/domain`.

---

## Role of each application

- **apps/web:** The only user-facing app. Next.js on port 3000. Auth, onboarding, select-account, app shell (`/app`), admin shell (`/admin`). Reads/writes Supabase via `@/lib/supabase/server` and `@/lib/supabase/server-admin`. Uses `@socialbud/services` for `ensureUserAccount` only; uses `@socialbud/shared` for job enqueue body validation in the API route.
- **apps/brain:** Backend for jobs only. Fastify on port 3001 (configurable). Serves `/health` and `POST /jobs/enqueue`. Depends on `@socialbud/db` (Postgres client + jobs helpers) and `@socialbud/domain` (job execution). Migrate script lives here: `pnpm --filter @socialbud/brain run migrate` creates the jobs table (and other schema from `@socialbud/db`) in the DB pointed to by `DATABASE_URL`.

---

## Role of each package

- **packages/db:** Postgres client (`createDbClient`), jobs table schema and helpers (`enqueueJob`, `claimNextJob`, `completeJob`, `failJob`), and SQL/type exports for accounts, account_members, profiles, billing, subscriptions. Used by **brain** (and by the migrate script). **Not** used by the web app.
- **packages/domain:** Job runner: `executeJob(ctx)`. Single default handler that logs the job. Used only by the brain worker. No product or app logic.
- **packages/shared:** Shared contracts: `enqueueJobBodySchema` (Zod) for the jobs API, env validation. Used by web (enqueue route) and brain so both agree on request shape and config.
- **packages/services:** Server-side helpers. Only `ensureUserAccount(supabase, userId)` today — ensures the user has at least one account/membership (used by web for onboarding and account selection). Most business logic still lives in the web app.

---

## Where business logic lives

- **Product and app behavior:** In **apps/web**: server actions and RSC in route segments (e.g. `app/(app)/app/settings/actions.ts`, `app/(admin)/admin/(main)/users/actions/*.ts`). Data access is direct Supabase calls from those actions/layouts.
- **Account-onboarding / "ensure one account":** In **packages/services** (`ensureUserAccount`), used by web.
- **Background job execution:** In **packages/domain** (`executeJob`). Currently a single stub that logs; real job handlers would be added there (or delegated) by job type.

---

## How Supabase is used

- **Auth:** Cookie-based sessions via `@supabase/ssr`. `createClient()` in server components and server actions reads cookies; middleware refreshes the session.
- **Data:** All app tables (profiles, accounts, account_members, admins, invitations, etc.) live in Supabase Postgres. Web uses the anon key for user-scoped access and the **service role** key only on the server where needed (e.g. admin actions, `ensureUserAccount`, `updateUserBannedUntil`). RLS is enabled on tables; service role bypasses RLS.
- **Helpers:** `@/lib/supabase/server` (user-scoped), `@/lib/supabase/server-admin` (service role), `@/lib/supabase-admin` (e.g. `updateUserBannedUntil`). Web does **not** use `@socialbud/db` for Supabase data.

---

## How background jobs work

1. **Enqueue:** Client or server calls Next.js `POST /api/jobs/enqueue` with `{ type, payload }`. Route checks Supabase auth, then `fetch(BRAIN_URL/jobs/enqueue)` with the same body (plus e.g. `userId`). Brain validates body with `enqueueJobBodySchema`, then `enqueueJob(pool, { type, payload })` → INSERT into `jobs` table.
2. **Run:** Brain worker loop: `claimNextJob(pool)` (UPDATE one row to `running`), `executeJob({ jobId, type, payload })`, then `completeJob(pool, id)` or `failJob(pool, id)`.
3. **Database:** Jobs table is in the Postgres DB given by `DATABASE_URL` (often the same Supabase project). Schema and helpers come from `@socialbud/db`.

---

## Where admin functionality lives

- **Route group:** `app/(admin)/admin/` — layout checks auth and `admins` table; non-admins are redirected.
- **Main layout:** `app/(admin)/admin/(main)/layout.tsx` — sidebar, nav (Users, Admins, Corporations, etc.).
- **Features:** Under `app/(admin)/admin/(main)/`: e.g. `users/` (user/account management, mutations in `actions/`), `team-access/`, `corporations/`, etc. Admin actions use `getAdminUser()` and often `createServiceRoleClient()` for privileged writes (e.g. suspend, delete user, set `banned_until`).

---

## Architectural reality

The setup is **transitional**. The web app is the main system and owns almost all product logic; it talks to Supabase only and does not use the shared DB or domain packages. The brain is a separate, minimal job runner (HTTP + worker) that uses `@socialbud/db` and `@socialbud/domain`. There are two migration sources: **Supabase migrations** (`supabase/migrations/*.sql`) for the Supabase schema (auth, app tables), and the **brain migrate** script (from `@socialbud/db`), which is typically run once to ensure the jobs table (and any other schema from that package) exists in the same or another Postgres. The README describes this as an app-first vNext layout that may evolve; avoid assuming a single "service layer" or that all data flows through packages — today it does not.
