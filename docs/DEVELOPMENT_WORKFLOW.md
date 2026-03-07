# Development workflow

## Start the project locally

1. **Install**
   ```bash
   pnpm install
   ```

2. **Environment**
   - Copy `.env.example` to `apps/web/.env.local` (or `.env`) for the web app.
   - For the brain, set env in `apps/brain/.env` or repo root `.env` (migrate and worker read from cwd and parent paths).
   - Required:
     - **Web:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Optional: `SUPABASE_SERVICE_ROLE_KEY` (admin features, ensureUserAccount, etc.), `BRAIN_URL` (default `http://127.0.0.1:3001`).
     - **Brain:** `DATABASE_URL` (Postgres; often the same Supabase connection string so the jobs table lives in the same project).

3. **Database**
   - Ensure Supabase project exists and schema is applied (e.g. run Supabase migrations or use the dashboard).
   - Create the jobs table (and any other schema from `@socialbud/db`) once:
     ```bash
     pnpm db:migrate
     ```
     or `pnpm --filter @socialbud/brain run migrate`. Requires `DATABASE_URL`.

4. **Run**
   - **Web only:** `pnpm dev:web` → Next.js on port 3000.
   - **Brain only:** `pnpm dev:brain` → Fastify on port 3001.
   - **Brain worker only:** `pnpm --filter @socialbud/brain run dev:worker` → polls jobs table and runs jobs.
   - **Web + brain together:** `pnpm dev` (runs both in parallel; worker is still a separate command).

---

## Important environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Web | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web | Supabase anon key (public). |
| `SUPABASE_SERVICE_ROLE_KEY` | Web (server only) | Admin and backend-only operations. |
| `BRAIN_URL` | Web | URL of the brain service (default `http://127.0.0.1:3001`). Used by `POST /api/jobs/enqueue`. |
| `DATABASE_URL` | Brain | Postgres connection string (jobs table and migrate). |
| `PORT` | Brain | HTTP port (default 3001). |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Web | Optional; for app-sent emails (e.g. "account deleted" notification). |

---

## How the web app runs

- `pnpm dev:web` (or `pnpm --filter @socialbud/web run dev`) → `next dev --port 3000`.
- Uses `.env.local` / `.env` in `apps/web`. Build: `pnpm --filter @socialbud/web run build`.

---

## How the brain service runs

- **HTTP:** `pnpm dev:brain` → `tsx watch src/index.ts` → Fastify on port 3001 (or `PORT`).
- **Worker:** `pnpm --filter @socialbud/brain run dev:worker` → `tsx watch src/worker.ts` → polls every 2s, runs one job at a time.
- Production: Dockerfile builds the app; Fly runs the HTTP server. The worker can run on the same machine or a separate process (same codebase, different entry).

---

## How jobs work in dev

1. Start brain: `pnpm dev:brain`.
2. Start worker: `pnpm --filter @socialbud/brain run dev:worker`.
3. Start web: `pnpm dev:web`. Sign in, go to `/app`, use "Enqueue demo job" to POST to `/api/jobs/enqueue`. Web proxies to brain; brain inserts into `jobs`; worker picks up and logs the job.

---

## How migrations work

- **Supabase (app schema):** SQL in `supabase/migrations/*.sql`. Apply via Supabase CLI or dashboard to the Supabase Postgres project.
- **Brain / jobs:** No Supabase CLI usage in the brain. The script `apps/brain/src/migrate.ts` runs SQL from `@socialbud/db` (e.g. jobs table, accounts, profiles, RLS, etc.). Run once (or when schema in packages/db changes): `pnpm db:migrate` or `pnpm --filter @socialbud/brain run migrate`. Uses `DATABASE_URL`; can point to the same Supabase Postgres so the jobs table lives there.

---

## Preview deployments

- **Web:** Vercel config is in `vercel.json` (build command, output directory, install). Preview branches deploy the Next.js app; set `NEXT_PUBLIC_*` and `BRAIN_URL` (and optionally `SUPABASE_SERVICE_ROLE_KEY`) in Vercel for previews.
- **Brain:** Deployed separately (e.g. Fly.io via `apps/brain/fly.toml`). Previews may use a shared brain URL or a per-preview brain; document in the team how preview env is set.

---

## Production deployment overview

- **Web:** Deployed to Vercel. Build: `pnpm --filter "@socialbud/web..." run build`. Set production env vars in Vercel (Supabase, BRAIN_URL, Resend if used).
- **Brain:** Deployed to Fly.io (`fly deploy . --config apps/brain/fly.toml` from repo root). Uses Dockerfile in `apps/brain`. Exposes port 8080; set `DATABASE_URL` and any other secrets in Fly. Run the worker as a separate process or same app (e.g. another Fly process type) so jobs are consumed.
