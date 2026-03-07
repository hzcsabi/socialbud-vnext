# Socialbud vNext

Monorepo: Next.js (Vercel) + Fly.io backend (Fastify) + Supabase.

## Architecture

**apps/web** — Next.js app (port 3000). The main product: auth, onboarding, account selection, app and admin UIs. It talks to **Supabase directly** for auth (cookies/session), profiles, accounts, account_members, invitations, and all app data. It does not use `@socialbud/db` or `@socialbud/domain`. Server actions and RSC in the app do the data access and business logic for the product.

**apps/brain** — Fastify server (port 3001) and a background worker. Handles **jobs only**: HTTP endpoint `POST /jobs/enqueue` and a worker that polls for jobs, runs them, and marks them complete. Used for background processing (e.g. demo job). Depends on `@socialbud/db` (Postgres + jobs table) and `@socialbud/domain` (job execution).

**packages/db** — Postgres client, jobs table schema and helpers, and SQL/types for other tables (accounts, account_members, profiles, billing, subscriptions). Used by **brain** and by the migrate script. The **web** app does not use this package; it uses the Supabase client and its own types.

**packages/domain** — Job runner: `executeJob` (and job types). Used only by the **brain** worker. No product or app logic lives here today.

**packages/shared** — Shared contracts and validation: e.g. `enqueueJobBodySchema` for the jobs API, env validation. Used by **web** (enqueue route) and **brain** so both agree on request shape and config.

**packages/services** — A small set of shared, server-side services. Today it only exposes `ensureUserAccount` (used by web for onboarding and account selection). It is not the full “business layer”; most logic remains in the web app.

This layout is transitional: the goal is a cleaner, app-first vNext model over time. The README describes the repo as it is today, not a future target.

## Setup

1. **Install**

   ```bash
   pnpm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` in `apps/web` and `.env` (or env vars) for `apps/brain`. Set:

   - **Web:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `BRAIN_URL` (default `http://127.0.0.1:3001`).
   - **Brain:** `DATABASE_URL` (Postgres, e.g. Supabase connection string).

3. **Database**

   Create the `jobs` table (run once):

   ```bash
   pnpm --filter @socialbud/brain run migrate
   ```

   Ensure `DATABASE_URL` is set when running this.

## Run (vertical slice)

1. **Backend (Fly brain)**

   ```bash
   pnpm dev:brain
   ```

   Serves HTTP on port 3001 (`/health`, `POST /jobs/enqueue`).

2. **Worker (same machine or separate)**

   ```bash
   pnpm --filter @socialbud/brain run dev:worker
   ```

   Polls the `jobs` table and runs the dummy job handler.

3. **Frontend**

   ```bash
   pnpm dev:web
   ```

   Next.js on port 3000. Sign in at `/login`, open `/app`, use “Enqueue demo job” to send a job to the brain; the worker should pick it up and log it.

## Scripts

- `pnpm build` — build all packages and apps
- `pnpm dev` — run web + brain in parallel (worker is separate)
- `pnpm dev:web` — Next.js only
- `pnpm dev:brain` — Fastify server only
