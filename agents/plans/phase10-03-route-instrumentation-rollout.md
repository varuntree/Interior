# Phase 10.3 — Route Instrumentation Rollout

Objective
- Adopt `withRequestContext` across all v1 routes to ensure request start/end logs, correlation fields, and consistent error logging.

Strategy
- Sweep in small batches (by domain): auth/health → renders/collections → generations → community → billing/webhooks → profile/usage.
- Do not change business logic; wrap and replace `console.*` with request logger where feasible.

Adoption Checklist per Route
- [ ] Wrap with `withRequestContext` (compose with `withMethods`/`withMethodsCtx`).
- [ ] Use `ctx.logger` for logs; remove `console.*` in server code.
- [ ] Ensure `fail()` paths call `ctx.logger.error` with normalized code.
- [ ] Verify `x-request-id` in response.

Routes (tick as implemented)
- Auth & Health
  - [ ] `/api/v1/auth/me`
  - [ ] `/api/v1/health`
  - [ ] `/api/v1/status`
- Renders
  - [ ] `/api/v1/renders` (GET)
  - [ ] `/api/v1/renders/[id]` (GET, DELETE, PATCH)
- Collections
  - [ ] `/api/v1/collections` (GET, POST)
  - [ ] `/api/v1/collections/[id]` (GET, PATCH, DELETE)
  - [ ] `/api/v1/collections/[id]/items` (GET, POST)
  - [ ] `/api/v1/collections/[id]/items/[renderId]` (DELETE)
  - [ ] `/api/v1/collections/items/toggle` (POST)
  - [ ] `/api/v1/collections/upsert` (POST)
- Generations
  - [ ] `/api/v1/generations` (POST, GET placeholder)
  - [ ] `/api/v1/generations/[id]` (GET, PATCH, DELETE)
- Community (Public)
  - [ ] `/api/v1/community` (GET)
  - [ ] `/api/v1/community/collections` (GET)
  - [ ] `/api/v1/community/collections/[id]/items` (GET)
- Billing & Webhooks
  - [ ] `/api/v1/stripe/create-checkout` (POST)
  - [ ] `/api/v1/stripe/create-portal` (POST)
  - [ ] `/api/v1/webhooks/stripe` (POST)
  - [ ] `/api/v1/webhooks/replicate` (POST)
- Profile & Usage
  - [ ] `/api/v1/profile/settings` (GET, PATCH)
  - [ ] `/api/v1/usage` (GET) — already has request id; align to new wrapper

Files to Touch
- Each route file under `app/api/v1/**` listed above.

Verification
- `x-request-id` present across wrapped routes.
- Logs show `http.request.start/end` with status + duration.
- No `console.*` remains in route files.

Rollback
- Revert per‑route; wrapper is additive and safe.

