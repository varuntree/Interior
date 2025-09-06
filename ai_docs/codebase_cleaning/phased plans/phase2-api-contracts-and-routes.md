# Phase 2 — API Contracts & Routes Hygiene (Detailed Plan)

Objective: Normalize all v1 API routes to a consistent contract and handler structure: method enforcement via `withMethods`, input validation via Zod, responses via `ok/fail`, and routes → services (no repository imports in routes).

Scope (what we touch)
- Files under `app/api/v1/**` (excluding legacy bridges that only re-export v1).
- Only route handler code and imports. No schema/data model changes.
- If a route currently imports repositories directly, refactor to service calls (add minimal service wrappers if needed).

Out of scope
- Business logic changes inside services/repositories (beyond creating thin wrappers to keep routes clean).
- Webhook signing implementation changes (will keep current behavior; normalization only).

Safety & workflow
- Small PRs grouped by domain: generations, renders, collections, community, profile/usage, favorites, analytics, stripe/webhooks.
- Preserve response semantics; map legacy helpers (`badRequest`, `unauthorized`, etc.) to `fail` equivalents.

1) Pre-checks (must pass before and after each PR)
- npm run typecheck
- npm run lint
- npm run build
- npm run verify:grep

2) Contract standard (apply to every route)
- Method enforcement: `withMethods(['GET'|'POST'|...], async (req) => ...)` OR object-style `withMethods({ GET: handler })` (both acceptable).
- Validation: Zod schema for body/multipart or query params. Use `validateRequest` helper where JSON body is expected.
- Response: Use `ok(data)` on success; `fail(status, code, message, details?)` on errors.
- Headers: Default `Cache-Control: private, no-store` via helpers.
- No repositories imported in routes; call services only.

3) Normalization rules
- Replace `badRequest/unauthorized/forbidden/serverError` with `fail(400/401/403/500, CODE, message)` where possible.
- Ensure canonical error codes: VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, TOO_MANY_INFLIGHT, LIMIT_EXCEEDED, UPSTREAM_ERROR, INTERNAL_ERROR, METHOD_NOT_ALLOWED.
- Prefer a single success shape `{ success: true, data }`.

4) Route-by-route checklist (apply for each)
- Ensure `withMethods` present.
- Add/import Zod schema; validate body/query.
- Replace legacy helpers with `ok/fail`.
- Ensure calling a service (create thin service wrapper if route was using a repository).
- Remove unused imports and variables.

5) Known targets from initial audit
- Repository imports in routes (must refactor to services):
 - `app/api/v1/generations/[id]/route.ts` (imports `libs/repositories/renders`)
 - `app/api/v1/webhooks/replicate/route.ts` (imports `libs/repositories/generation_jobs`)
 - `app/api/v1/usage/route.ts` (imports `libs/repositories/profiles`)
- Legacy response helpers to convert:
  - `badRequest`, `unauthorized`, `forbidden`, `serverError` occurrences across admin/community, renders, collections.
- Missing Zod in some routes: ensure `z` present or validateRequest used.

6) Service shims (if needed)
- Add minimal service functions if a route currently needs a repository call only for simple read/write, to respect the Route → Service → Repo boundary.
- Example:
  - `services/generations.getJobStatus(ctx, id)` wraps repository calls.
  - `services/webhooks.handleReplicateWebhook(ctx, payload)` encapsulates repo updates.
  - `services/usage.getSummary(ctx, userId)` wraps profiles/usage reads.

7) Testing & validation per PR
- Hit endpoints with minimal curl or Thunder Client where applicable (optional).
- Verify response shape matches standard.
- Scripts: `typecheck`, `lint`, `build`, `verify:grep`.

8) Deliverables (completed)
- Generations + webhook refactor merged; Usage route using profile service.
- Updated `ai_docs/codebase_cleaning/CHANGELOG.md` with Phase 2 summary.

9) Exit criteria (Phase 2 complete)
- No repository imports in `app/api/v1/**` routes. (Verified for targeted routes.)
- All routes using `ok/fail` and have Zod validation where needed. (Spot-verified.)
- Canonical error codes used consistently.
- All scripts pass; smoke calls return normalized JSON.
