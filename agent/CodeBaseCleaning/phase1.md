# Phase 1 — Foundations (Core Utilities & Contracts)

Purpose
- Standardize how every route validates, handles errors, and returns responses; tighten env and client wrappers; introduce minimal DTOs and correlation logging. Keep changes small, additive, and non‑destructive.

Scope
- Route helpers adoption, error taxonomy usage, env/URL handling sanity, tiny DTO layer, optional correlation IDs, and a quick pass to eliminate any route→repo call left.

Outcomes (Definition of Done)
- All v1 routes use `withMethods` + shared validation helpers.
- All v1 routes return via `ok`/`fail` (or `accepted/created`) with sensible cache headers.
- Error codes come from a single place; catch blocks normalize via helpers.
- No route directly imports repositories (routes → services only).
- Env and URL helpers are consistently used; no client secrets are exposed.
- Minimal DTOs exist for high‑traffic endpoints to avoid contract drift.
- Optional: Lightweight correlation ID appears in logs across route → service.
- Build and grep checks pass.

---

Execution Status (Completed)
- Normalized error handling in selected routes to use `fail()` and added `dynamic = 'force-dynamic'`:
  - `app/api/v1/collections/items/toggle/route.ts`
  - `app/api/v1/collections/upsert/route.ts`
  - `app/api/v1/community/collections/[id]/items/route.ts`
  - `app/api/v1/favorites/list/route.ts`
  - `app/api/v1/favorites/toggle/route.ts`
- Enforced route→service boundary for community collections:
  - Added `libs/services/community_collections.ts`
  - Updated `app/api/v1/community/collections/route.ts` to use the service
  - Removed temporary ESLint override for that route
- Added helpers/types:
  - `libs/api-utils/normalize-error.ts` (not yet widely adopted; available)
  - `libs/api-utils/with-request.ts` and adopted in `/api/v1/usage` (adds `x-request-id`)
  - DTOs under `types/api/{usage,renders,collections}.ts`
- Lint/typecheck succeed; build cannot be validated in sandbox due to Next worker permissions, but Phase 0 script and lint/typecheck are green.
- Added `withMethodsCtx` helper and applied to dynamic routes:
  - `/api/v1/renders/[id]` (GET, DELETE)
  - `/api/v1/generations/[id]` (GET, PATCH, DELETE)
  - `/api/v1/collections/[id]` (GET, PATCH, DELETE)
  - `/api/v1/collections/[id]/items` (GET, POST)
  - `/api/v1/collections/[id]/items/[renderId]` (DELETE)
  - `/api/v1/community/collections/[id]/items` (GET)
- Added `withMethods(['GET'])` to public simple endpoints:
  - `/api/v1/health`, `/api/v1/status`

Changed files
- Routes: as listed above (error handling and dynamic headers).
- Services: `libs/services/community_collections.ts` (new).
- Helpers: `libs/api-utils/normalize-error.ts` (new), `libs/api-utils/with-request.ts` (new).
- Types: `types/api/usage.ts`, `types/api/renders.ts`, `types/api/collections.ts` (new).
- ESLint: `.eslintrc.json` (removed temporary override for community collections).

## Step 0 — Baseline Audit (no code changes)
- Re‑check all `app/api/v1/**` routes for:
  - `withMethods` present
  - `ok`/`fail` usage (including catch blocks)
  - `export const dynamic = 'force-dynamic'` on authenticated or dynamic endpoints
  - Cache headers: `no-store` by default; use `CACHE_CONFIGS` for public feeds
- Confirm no `@/libs/repositories/*` in routes.
- Confirm `createServiceSupabaseClient()` used consistently (SSR client).

Deliverables
- Short audit list of any outliers (route file paths + behavior).

---

## Step 1 — Normalize Response/Error Handling
- Replace remaining direct `Response.json({ success: false ... })` in catch blocks with `fail()` keeping the same status and error code.
- Prefer `validate()` / `validateRequest()` to keep request parsing consistent.
- Ensure all newly touched routes import from `libs/api-utils/*` only.

Targets (identified)
- `app/api/v1/collections/items/toggle/route.ts`
- `app/api/v1/collections/upsert/route.ts`
- `app/api/v1/community/collections/[id]/items/route.ts`
- `app/api/v1/favorites/{list,toggle}/route.ts`

Deliverables
- All above routes use `fail()` in catch paths, not raw `Response.json`.

---

## Step 2 — Error Taxonomy Adoption
- Add a tiny helper: `libs/api-utils/normalize-error.ts` to translate thrown errors (including `ApiError`) to `{ code, message, httpStatus }` using `ERROR_MAP`.
- Update touched routes’ catch blocks to use the helper for coherent codes: `UNAUTHORIZED`, `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`, etc.
- Do not change user‑visible strings materially; keep messages concise and safe.

Deliverables
- New helper; routes use `fail(status, code, message)` consistently.

---

## Step 3 — Route Method/Caching Sanity
- Ensure every v1 route has `withMethods([...])` and an explicit `export const dynamic = 'force-dynamic'` where the response is user/session scoped or dynamic.
- Apply `CACHE_CONFIGS` where appropriate:
  - AUTH/user data → `CACHE_CONFIGS.AUTH`
  - Public gallery/data → `CACHE_CONFIGS.PUBLIC`
  - Default → no-store (status quo)

Deliverables
- Diff list of headers added where missing.

---

## Step 4 — Enforce Route → Service Boundary
- Replace the temporary exception in `app/api/v1/community/collections/route.ts` by introducing a tiny `libs/services/community_collections.ts` wrapper that calls `community_images` repo and returns the same payload.
- Update the route to import the service; remove the ESLint temporary override added in Phase 0.

Deliverables
- New service wrapper; route updated; ESLint override removed.

---

## Step 5 — Env & URL Helpers Consistency
- Prefer `libs/env/index.ts` for server env access in server code. Review:
  - `libs/supabase/middleware.ts` (currently uses `process.env.NEXT_PUBLIC_*`) — low‑risk to keep as is, or refactor to `env.public.*` for consistency.
  - `libs/api-utils/url-validation.ts` — continue to accept `NEXT_PUBLIC_APP_URL`; ensure helpful errors remain. Optionally import `env.public` for URL/anon keys when composing URLs.
- Confirm no secrets imported in client code; `NEXT_PUBLIC_*` only on the client.

Deliverables
- If refactor is chosen, small updates to those two files; otherwise, document decision.

---

## Step 6 — Minimal DTOs & Mappers (High‑Value Endpoints)
- Create `types/api/` with minimal DTOs for:
  - Usage summary (`/api/v1/usage`)
  - Renders list (`/api/v1/renders`)
  - Collections list (`/api/v1/collections`)
- Add tiny mappers in services to build these DTOs (pure functions), keeping transport‑layer types out of repositories.
- Keep scope minimal (no heavy refactors).

Deliverables
- New type defs + small mappers; routes import DTO types for response typing.

---

## Step 7 — Lightweight Correlation ID (Optional but Valuable)
- Add a simple `withRequestId(handler)` in `libs/api-utils/with-request.ts` that:
  - Generates a short `requestId` (uuid v4 or timestamp+rand).
  - Attaches it to a `logger` call context and response header `x-request-id`.
- In routes we touch in this phase, wrap the handler with `withMethods([...])` and `withRequestId(...)`.
- In services, accept an optional `ctx.requestId` and pass into `logger.*` fields.

Deliverables
- Helper + adoption in a few key routes (usage, generations submit/get, webhooks) without invasive changes.

---

## Step 8 — Repo & Service Hygiene (Quick Pass)
- Repositories: ensure functions are pure, no HTTP imports (already sane).
- Services: verify no admin client usage (other than admin services) and no direct Response/Next imports.
- Ensure storage helpers are invoked from services, not routes.

Deliverables
- Notes only; address any rare outliers if trivial.

---

## Step 9 — Verify & Guard
- Run `npm run typecheck && npm run lint && npm run build`.
- Run `npm run verify:grep` and `npm run verify:phase0` (Phase 0 checks remain applicable).

Deliverables
- Zero TypeScript errors; lint warnings acceptable if pre‑existing but minimized in touched files.

---

## Step 10 — Update Tracker & Docs
- Update `agent/CodeBaseCleaning/00-index-and-tracking.md`:
  - Mark Phase 1 boxes completed.
  - Notes: routes normalized, error helper added, boundary fix for community collections, any env decisions, DTOs, and request ID adoption.
- Add brief note to `ai_docs/core/05-api.md` if any response shape/caching headers changed (not expected beyond standardization).

Deliverables
- Tracker updated; docs note added if needed.

---

Risks & Constraints
- Keep changes minimal to avoid cascading refactors.
- Correlation ID is optional; adopt only where straightforward.
- DTOs limited to high‑value endpoints to avoid over‑engineering.

---

Verification Checklist (Phase 1)
- All touched routes: `withMethods`, `ok/fail`, `dynamic`, sensible cache headers.
- No direct repo imports in routes.
- Errors normalized via central map/helper.
- Env usage consistent and safe (no secrets client‑side).
- Build + guard scripts pass.

Result (to fill on completion)
- Date: 2025-09-12
- Branch/Commit: working tree (no commit in this session)
- Verify logs: typecheck/lint passed; build blocked by sandbox EPERM; locally run `npm run build`.
- Notes:
  - Error handling normalized; correlation header added to usage route
  - Boundary fix applied for community collections route
  - DTOs added for documentation/typing; adoption optional
  - `normalize-error` helper added for future consolidation
