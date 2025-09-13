# Phase 10.5 — Error Normalization Rollout

Objective
- Ensure all routes return normalized errors using the central `ERROR_CODES`/`fail()` helpers and log errors consistently.

Deliverables
- Replace ad‑hoc `Response.json`/raw messages with `fail(status, code, message)`.
- Adopt `normalizeError()` in catch blocks where we bubble unknown errors.

Implementation Steps
1) Route sweep
   - In every route catch, call `ctx.logger.error('http.request.error', { code, message })` before returning `fail(...)`.
   - Map known domain errors to codes (e.g., `TOO_MANY_INFLIGHT`, `LIMIT_EXCEEDED`, `VALIDATION_ERROR`).
2) Service thrown errors
   - Prefer throwing `Error("CODE: message")` only when mapping is easy; otherwise let route map via `normalizeError`.
3) Webhooks
   - Never 5xx to provider; log error and return OK with a benign message.

Checklists
- [ ] All v1 routes use `fail()` with a recognized error code.
- [ ] Catch blocks use `normalizeError()` where appropriate.
- [ ] Error logs do not leak PII or raw stacks.

Files to Touch
- All `app/api/v1/**/route.ts` files with catch blocks.
- `libs/api-utils/normalize-error.ts` (extend tests later if needed).

Verification
- Grep shows zero remaining `Response.json({ success: false` in v1 routes.
- Spot test a few endpoints for proper codes.

Rollback
- Can be applied route‑by‑route.

