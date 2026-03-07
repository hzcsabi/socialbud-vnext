# Adding features

Short guides for common tasks. Paths are relative to the repo root.

---

## Adding a new product feature (UI + server action)

1. **Page:** Add a route under the app shell, e.g. `apps/web/src/app/(app)/app/<feature>/page.tsx`. Use RSC and fetch data in the page or layout with `createClient()` from `@/lib/supabase/server`.
2. **Nav:** Add a link in `apps/web/src/app/(app)/layout.tsx` in the sidebar nav.
3. **Server action:** In the same segment or a sibling, add or use an `actions.ts` (e.g. `apps/web/src/app/(app)/app/<feature>/actions.ts`). Mark with `"use server"`, get the user via `createClient()` and `getUser()`, then use Supabase to read/write. Return `{ error?: string }` or data as needed.
4. **Form:** In the page or a client component, use `<form action={submitAction}>` or a client handler that calls the action. Example pattern: `apps/web/src/app/(app)/app/account/page.tsx` and `app/account/actions.ts`.

**Example paths:**
- Page: `apps/web/src/app/(app)/app/account/page.tsx`
- Action: `apps/web/src/app/(app)/app/account/actions.ts`
- Layout (nav): `apps/web/src/app/(app)/layout.tsx`

---

## Adding a background job

1. **Enqueue from web:** Call `POST /api/jobs/enqueue` with body `{ type: "<jobType>", payload: { ... } }`. The route validates the user and forwards to the brain; payload is validated with `enqueueJobBodySchema` from `@socialbud/shared`. Example: `apps/web/src/app/(app)/app/enqueue-button.tsx`.
2. **Handler:** Implement the behavior in `packages/domain/src/jobs.ts` inside `executeJob(ctx)`. Branch on `ctx.type` (e.g. `if (ctx.type === "demo") { ... }`). Today there is a single default that logs; add new types and keep the function synchronous or return a Promise if you make it async.
3. **Worker:** No change. The brain worker already calls `executeJob` for every claimed job.

**Example paths:**
- Enqueue: `apps/web/src/app/api/jobs/enqueue/route.ts`, `apps/web/src/app/(app)/app/enqueue-button.tsx`
- Schema: `packages/shared/src/jobs.ts`
- Handler: `packages/domain/src/jobs.ts`

---

## Adding an admin tool

1. **Route:** Add a segment under `apps/web/src/app/(admin)/admin/(main)/`, e.g. `users/` or a new name like `reports/`. Add `page.tsx` and, if needed, `actions.ts`.
2. **Auth:** The layout at `(main)/layout.tsx` already checks `getAdminUser()` and redirects non-admins. In actions, call `getAdminUser()` and return an error if null.
3. **Privileged data:** Use `createServiceRoleClient()` from `@/lib/supabase/server-admin` when you need to bypass RLS (e.g. list all users, update any profile). Never expose this client to the client.
4. **Nav:** Add a link in `apps/web/src/app/(admin)/admin/(main)/layout.tsx` in the sidebar.

**Example paths:**
- Page: `apps/web/src/app/(admin)/admin/(main)/users/page.tsx`
- Mutations: `apps/web/src/app/(admin)/admin/(main)/users/actions/users-mutations.ts`, `accounts-mutations.ts`
- List/helpers: `apps/web/src/app/(admin)/admin/(main)/users/actions/users-list.ts`, `shared.ts`
- Layout: `apps/web/src/app/(admin)/admin/(main)/layout.tsx`

---

## Adding shared helpers

- **Web-only (server or client):** Put in `apps/web/src/lib/`, e.g. `lib/utils.ts`, `lib/account.ts`. Use `@/lib/...` imports.
- **Shared with brain (contracts, validation):** Add to `packages/shared` and export from `packages/shared/src/index.ts`. Example: `packages/shared/src/jobs.ts`.
- **Server-side, Supabase-aware, used by web:** Add to `packages/services` (e.g. a new file under `accounts/` or a new folder), export from `packages/services/src/index.ts`. Example: `packages/services/src/accounts/ensure-user-account.ts`.

---

## Adding a new API route

1. **File:** Create `apps/web/src/app/api/<path>/route.ts`, e.g. `api/notify/route.ts`.
2. **Handler:** Export `GET`, `POST`, etc. Request/Response are standard Web API. Use `createClient()` from `@/lib/supabase/server` to enforce auth when needed.
3. **Call from client:** Use `fetch("/api/<path>", { method: "POST", ... })` or call from a server action.

**Example paths:**
- Enqueue: `apps/web/src/app/api/jobs/enqueue/route.ts`
- Signout: `apps/web/src/app/api/auth/signout/route.ts`
