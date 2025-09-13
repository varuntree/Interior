# Phase 10.8 — Guards & Verification

Objective
- Prevent regressions by enforcing observability standards via scripts and greps.

Deliverables
- `scripts/verify-phase10.sh` to run:
  - Grep: disallow `console.(log|error|warn)` in `app/api/**`, `libs/services/**`, `libs/repositories/**`, `libs/observability/**`, `libs/stripe.ts` (allow in client components and tests).
  - Grep: ensure `app/api/v1/**` routes import `withRequestContext` or have `x-request-id` pattern.
  - Grep: no `Response.json({ success: false` in v1 routes (must use `fail`).
  - Typecheck/lint/build aggregation.
- `package.json` script `verify:phase10`.

Implementation Steps
1) Add shell script with clear allow/deny globs; make it idempotent.
2) Update `package.json` with `verify:phase10`.

Checklists
- [ ] Script exists and runs locally.
- [ ] CI/PR template mentions `verify:phase10`.

Files to Touch
- `scripts/verify-phase10.sh` (new)
- `package.json` (script)

Rollback
- Script is non‑blocking by default; can disable temporarily.

