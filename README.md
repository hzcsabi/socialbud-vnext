# Socialbud vNext

Monorepo: Next.js (Vercel) + Fly.io backend (Fastify) + Supabase. Business logic in `packages/domain`, DB layer in `packages/db`, shared types/contracts in `packages/shared`.

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
