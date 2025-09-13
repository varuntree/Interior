# Phase 10.2 — Request Context & Correlation

Objective
- Create a single HTTP wrapper to attach `requestId`, derive request metadata, and provide a request‑scoped logger into the handler. Emit `http.request.start` and `http.request.end` with duration.

Deliverables
- `libs/observability/request.ts`:
  - `withRequestContext(handler)` → wraps `(req, ctx)` handlers.
  - Extracts: `requestId`, `route` (from `ctx?.params` + pathname), `method`, `ip?`, `userAgent?`.
  - Creates `reqLogger = createLogger({ requestId, route, method })` and emits start/end events.
  - Adds `x-request-id` header to response.
- Update `withMethodsCtx` usage to compose with `withRequestContext` in v1 routes.

Implementation Steps
1) Build wrapper function
   - Signature: `(methods, handler) => (req, ctx) => ...` or use as `withRequestContext(handler)` inside existing `withMethods`.
   - Log `http.request.start` at entry; on completion log `http.request.end` with status and `durationMs`.
2) Thread logger
   - Call `handler(req, { ...ctx, logger: reqLogger, requestId })`.
   - Update services to accept `logger?` (Phase 10.4) — wrapper will pass only to routes for now.
3) Add header
   - Ensure `x-request-id` is set on all wrapped responses.

Checklists
- [ ] Wrapper added and unit sanity checks done.
- [ ] At least 1–2 routes adopted to validate shape (e.g., `/api/v1/usage`, `/api/v1/renders`).
- [ ] `x-request-id` present in responses.

Files to Touch
- `libs/observability/request.ts` (new)
- All v1 route handlers (adoption in next phase)

Rollback
- Individual route adoption can be paused; wrapper is additive.

