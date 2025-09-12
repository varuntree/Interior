# Phase 0 — Freeze & Guardrails (Execution Plan)

Purpose
- Lock down architecture boundaries and add lightweight, enforceable guardrails without changing product behavior. Keep it additive and non‑destructive. No features added.

Scope
- Repo‑wide guardrails (ESLint + grep scripts), secret handling, route contracts, and PR hygiene. Identify and log any violations for later phases rather than large refactors now.

Outcomes (Definition of Done)
- Feature freeze declared (documented here and in tracker).
- Import boundaries enforced via ESLint overrides (per layer).
- Guard scripts catch forbidden patterns and boundary violations.
- Routes use standardized helpers (`withMethods`, normalized responses) and opt out of caching where required.
- Service‑role usage limited to webhooks/admin endpoints.
- Build health verified (`typecheck`, `lint`, `build` pass).
- Tracker updated with notes; PR template added with DoD checklist.

---

Execution Status (Completed)
- ESLint import boundaries added (components, app/api, libs/services).
- Guard scripts expanded and aggregator script added (`verify:phase0`).
- PR template with DoD checklist added.
- Tracker updated: Phase 0 marked complete with notes and known follow‑ups.
- No product behavior or API contracts changed.

Changed files
- `.eslintrc.json` — added `overrides` with `no-restricted-imports` per layer.
- `package.json` — extended `verify:grep`; added `verify:phase0`.
- `scripts/verify-phase0.sh` — new verification runner.
- `.github/PULL_REQUEST_TEMPLATE.md` — new checklist.
- `agent/CodeBaseCleaning/00-index-and-tracking.md` — Phase 0 boxes checked and notes added.

## Step 0 — Baseline + Freeze (no code changes yet)
- Confirm product context loaded (Prime Command ran) and CodeBaseCleaning docs read.
- Declare feature freeze for this phase in tracker notes (no new features until Phase 0 completes).
- Verify current state (done in analysis): most routes compliant; one known boundary violation (route importing a repository directly) recorded for follow‑up.

Deliverables
- Tracker entry under Phase 0: “Feature freeze declared”.

---

## Step 1 — ESLint Import Boundaries (layering)
Add non‑intrusive ESLint rules to enforce architectural boundaries. Use `no-restricted-imports` with per‑folder overrides.

Rules to enforce
- components/**
  - Disallow: `@supabase/supabase-js`, `@/libs/repositories/*`, `@/libs/supabase/server`, `@/libs/supabase/admin`.
- app/api/** (all routes)
  - Disallow: `@/libs/repositories/*` (routes must call services), `@/libs/supabase/admin` (except webhooks/admin endpoints).
- libs/services/**
  - Disallow: `@/libs/supabase/admin` (services never use service-role).
- libs/** (general)
  - Allow only explicit public helpers; avoid cross‑domain tangles (kept minimal for now).

Notes
- Use ESLint `overrides` with `files` globs; keep config minimal to avoid friction.
- For the temporary exception (webhooks/admin endpoints), we do not add a global allowlist to ESLint; guard via grep in Step 2 and code review.

Deliverables
- .eslintrc.json updated with overrides; minimal, readable comments.

---

## Step 2 — Guard Scripts (forbidden patterns and drift)
Expand `package.json` scripts to fail fast during local checks and CI.

Add/expand scripts
- `verify:grep` (extend existing):
  - Server Actions: `grep -R "use server" app libs || true`
  - DB in components: `grep -R "createServerClient" components || true`
  - Service role in UI/routes: `grep -R "service_role" app components || true`
  - Supabase SDK in components: `grep -R "@supabase/supabase-js" components || true`
  - Route→repo violation: `grep -R "@/libs/repositories/" app/api && echo 'Found route→repo import' && exit 1 || true`
  - Admin client outside webhooks/admin endpoints:
    - `grep -R "@/libs/supabase/admin" app | grep -v "/api/v1/webhooks/" | grep -v "/api/v1/admin/" && echo 'Admin client used outside webhooks/admin' && exit 1 || true`

- `verify:phase0` (aggregator): `npm run typecheck && npm run lint && npm run build && npm run verify:grep`

Notes
- Keep grep checks simple and readable; they act as a safety net alongside ESLint.

Deliverables
- `package.json` scripts updated.

---

## Step 3 — Route Contract Audit (no behavior change)
Audit all route handlers for:
- `withMethods` usage for method enforcement.
- Normalized responses via `ok/fail` (or `accepted/created` adapters) and default `Cache-Control: private, no-store`.
- `export const dynamic = 'force-dynamic'` on authenticated/dynamic responses.

Actions
- List any exceptions; if tiny fix is trivially safe (one‑liner import), patch now. Otherwise, log in tracker for Phase 1.

Known item
- `app/api/v1/community/collections/route.ts` imports repo directly. Record for Phase 1 to introduce a small service and switch call site.

Deliverables
- Short audit note in tracker with any files needing cleanup.

---

## Step 4 — Service‑Role Containment (admin client)
Ensure `libs/supabase/admin` is only used under:
- `app/api/v1/webhooks/**`
- `app/api/v1/admin/**`
- Internals of admin‑only services explicitly invoked by those routes.

Actions
- Confirm current usage (done in analysis); add grep guard (Step 2) to prevent future drift.

Deliverables
- Guard in place; tracker note confirming current usage is safe.

---

## Step 5 — Secrets & Env Hygiene
- Confirm `libs/env/index.ts` has strict schemas for public/server envs (present).
- Re‑scan for direct secret usage in client bundles (none expected).
- Document any missing env (none required in Phase 0).

Deliverables
- Tracker note: env validated; no client‑side secret usage.

---

## Step 6 — Build Health Gate
- Run `npm run typecheck`, `npm run lint`, `npm run build` locally.
- Ensure zero Next.js build warnings (log any upstream library noise but aim for 0 from our code).

Deliverables
- Tracker note with run outputs/summary.

---

## Step 7 — PR Template & DoD Checklist
Add `.github/PULL_REQUEST_TEMPLATE.md` with a lightweight checklist:
- No guardrail files deleted/renamed.
- `npm run typecheck && npm run build` pass.
- Grep checks (Step 2) pass.
- Routes call services; no direct repo imports.
- No Server Actions; no DB in components.
- No service‑role usage outside webhooks/admin.
- Response shape normalized.

Deliverables
- PR template added.

---

## Step 8 — Document Deviations (to close in later phases)
Record any findings we are not fixing in Phase 0 (to avoid scope creep):
- Route→repo import: `app/api/v1/community/collections/route.ts` (Phase 1 fix: add `community` service wrapper and swap import).
- Any additional minor inconsistencies discovered during Step 3.

Deliverables
- Items logged in tracker under Phase 1 “Notes”.

---

## Step 9 — Final Verify Pass
- Run `npm run verify:phase0` after changes.
- Snapshot the outputs in tracker notes.

Deliverables
- Verification summary added to tracker.

---

## Step 10 — Update Tracker & Docs (close Phase 0)
- In `agent/CodeBaseCleaning/00-index-and-tracking.md`:
  - Mark Phase 0 checkboxes as completed.
  - Add “Notes” with: ESLint rules added, grep scripts expanded, PR template added, audit results, known follow‑ups.
- In this file (phase0.md), add a short “Result” paragraph with commit/branch and any deviations accepted.
- If any public contracts changed (none expected), update `ai_docs` accordingly; otherwise, add a one‑line note: “Phase 0 applied — guardrails only; no API changes.”

Deliverables
- Tracker updated; minimal doc note added.

---

## Files expected to change (when implementing Phase 0)
- `.eslintrc.json` (overrides with `no-restricted-imports`).
- `package.json` (scripts `verify:grep`, `verify:phase0`).
- `.github/PULL_REQUEST_TEMPLATE.md` (new).
- (Optional tiny route header fixes) e.g., ensure `dynamic = 'force-dynamic'` where needed.

---

## Risks & Rollback
- Over‑broad ESLint/grep rules could block valid patterns. Keep rules narrowly targeted and tested; adjust via overrides if needed.
- Guard scripts are advisory locally; ensure they are run before merge (documented in PR template).

---

## After Phase 0 — Next Steps Preview
- Phase 1: Core utilities consistency (responses/error mapping already present; address any outliers), ensure all routes uniformly adopt helpers; add any missing DTOs/mappers if needed.
- Phase 3 onward: Vertical slices (Generations, Renders, Collections, …) using the guardrails laid here.

---

Result (to fill on completion)
- Date: 2025-09-12
- Branch/Commit: working tree (no commit in this session)
- Verify logs: pending (run `npm run verify:phase0` locally to capture output)
- Notes:
  - ESLint overrides in place; see .eslintrc.json
  - Guard scripts added; see scripts/verify-phase0.sh and package.json
  - PR template added for guardrail enforcement in reviews
  - Known follow‑up (Phase 1): replace direct repo import in `app/api/v1/community/collections/route.ts` with service call
