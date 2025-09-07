# Phased Cleanup Roadmap

This roadmap sequences cleanup work by aspect. We complete each phase fully before moving to the next. Each phase includes scope, tasks, automation, deliverables, and exit criteria.

## Legend
- Scope: What this phase covers and what it explicitly excludes
- Tasks: Concrete steps to execute
- Automation: Commands/scripts to run
- Deliverables: Artifacts and PR contents
- Exit Criteria: Must-haves before closing the phase

---

## Phase 0 — Prep & Guardrails (Baseline)
- Status: Completed
- Scope: Ensure safety rails are active before any changes
- Tasks:
  - Confirm handbook guardrails (no deletions of core files)
  - Verify scripts exist in `package.json`: `typecheck`, `lint`, `build`, `verify:grep`
  - Ensure `libs/api-utils/{responses,methods,supabase}.ts` are present and used
  - Verify `libs/app-config/runtime.ts` exists and loads
- Automation:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run verify:grep`
- Deliverables:
  - Updated scripts (if missing)
  - Short status note in `ai_docs/codebase_cleaning/CHANGELOG.md`
- Exit Criteria:
  - All scripts pass locally
  - Forbidden grep checks return 0 matches

---

## Phase 1 — Design System & UI Tokens
- Status: Completed
- Scope: Replace hardcoded styles with token-based Tailwind utilities; ensure theme parity and responsiveness
- Excludes: Business logic changes, API changes
- Tasks:
  - Run UI token audit (see 02-audits.md)
  - Replace inline `[#xxxxxx]`, custom radius/shadow with tokenized classes
  - Normalize component variants (buttons, cards, inputs) to shared patterns
  - Verify dark mode colors and focus rings are visible
  - Mobile-first pass: sticky primary CTA on generator, min 44px tap targets
- Automation:
  - `rg` commands from 02-audits.md (UI Tokens Audit)
- Deliverables:
  - PR: UI tokenization changes across `components/**/*`
  - Notes: before/after samples, any exceptions documented
- Exit Criteria:
  - No hardcoded color/radius/shadow in components
  - Light/dark parity verified on key pages
  - Responsive checks pass (generator, renders, collections)

---

## Phase 2 — API Contracts & Routes Hygiene
- Status: Completed
- Scope: Normalize responses, method enforcement, and input validation across `app/api/v1/**`
- Excludes: Service/repository logic changes (unless required to conform)
- Tasks:
  - Ensure `withMethods` present on all routes
  - Add Zod schemas for inputs; validate body/query as needed
  - Replace ad hoc responses with `ok`/`fail`
  - Harmonize error codes to canonical set
- Automation:
  - `rg -n "withMethods\(" app/api/v1`
  - `rg -n "ok\(|fail\(" app/api/v1`
  - `rg -n "from 'zod'" app/api/v1`
- Deliverables:
  - PR: Route handlers updated to standard template
  - Update: `07-api-contracts-and-errors.md` if any nuance added
- Exit Criteria:
  - All v1 routes comply (methods, zod, ok/fail)
  - Contracts documented where non-trivial

---

## Phase 3 — Services/Repositories Boundaries
- Status: Completed
- Scope: Enforce clean layering; remove logic from routes, DB from services, business rules from repositories
- Excludes: Schema changes
- Tasks:
  - Move any business logic out of routes into services
  - Refactor repositories to pure DB access; no HTTP/Next imports
  - Ensure services receive a context `{ supabase }` and compose repos/SDKs
  - Add/adjust unit seams where missing
- Automation:
  - `rg -n "from '@/libs/repositories/" app/api/v1 | wc -l` (expect 0)
- Deliverables:
  - PR: Refactors across services/repos with minimal surface changes
  - Notes: call graph summaries per domain
- Exit Criteria:
  - No repository imports in routes
  - Repositories have only DB I/O and typing

---

## Phase 4 — Storage Paths & Asset Management
- Status: Completed
- Scope: Standardize bucket usage, path conventions, and helper usage
- Excludes: CDN/domain changes
- Tasks:
  - Confirm all uploads use storage helpers
  - Enforce input/output path conventions
  - Ensure no service-role usage outside webhooks
  - Verify public asset accessibility and cache headers
- Automation:
  - Code search for direct `supabase.storage` usage in services (ensure via helpers)
- Deliverables:
  - PR: Replace ad hoc storage calls with helpers; fix paths
  - Update: `08-storage-and-paths.md` with any clarifications
- Exit Criteria:
  - All storage ops via helpers; paths match spec
  - Webhook and services adhere to least privilege

---

## Phase 5 — Runtime Config Consolidation
- Status: Completed
- Scope: Remove duplicated presets/limits; route all such config through `libs/app-config/runtime.ts`
- Excludes: Changing plan priceIds (mapping remains external)
- Tasks:
  - Find duplicated constants in components/hooks/services
  - Replace with imports from `runtimeConfig`
  - Ensure UI file inputs enforce types/sizes from `runtimeConfig.limits`
- Automation:
  - `rg -n "presets|roomTypes|styles|variants|aspectRatio" components hooks libs/services | rg -v "libs/app-config/runtime"`
- Deliverables:
  - PR: Centralize constants usage
  - Update: `06-runtime-config-and-presets.md` if needed
- Exit Criteria:
  - No duplicated presets/limits outside runtime config

---

## Phase 6 — Generation Engine Quality & Observability
- Status: Completed
- Scope: Improve reliability, logging, and correctness of generation flows
- Excludes: New features
- Tasks:
  - Add/verify logging on job lifecycle and webhook processing
  - Ensure idempotency on submit and webhook handlers
  - Add unit tests: prompt builder and adapter mapping
  - Normalize upstream error messages; cap lengths; no PII in logs
- Automation:
  - Run unit tests (Vitest/Jest or minimal asserts)
- Deliverables:
  - PR: Logging, idempotency checks, tests
  - Update: `09-observability-and-logs.md`
- Exit Criteria:
  - Logs present at key transitions; tests pass; idempotency verified

---

## Phase 7 — Performance & Responsiveness
- Status: Completed
- Scope: Reduce avoidable re-renders, optimize lists, ensure responsive behavior
- Excludes: Suspense/complex caching
- Tasks:
  - Memoize heavy lists; lazy-load offscreen images
  - Verify image sizes and layout stability
  - Check generator page CPU/Memory in dev tools
- Automation:
  - Lighthouse dev snapshot (manual)
- Deliverables:
  - PR: Targeted performance fixes
  - Notes: Before/after observations
- Exit Criteria:
  - Noticeable reduction in re-render hotspots; smooth scroll and image load

---

## Phase 8 — Security & Secrets Review
- Status: Completed
- Scope: Validate least-privilege and secret handling
- Excludes: Third-party rotations (unless necessary)
- Tasks:
  - Ensure no secrets in client bundle
  - Confirm service-role usage only inside webhooks
  - Verify RLS policies reference and data access patterns
- Automation:
  - `rg -n "process\.env\.(STRIPE|SUPABASE|REPLICATE|SERVICE_ROLE)" components`
  - Quick RLS smoke: read/write attempts where applicable (manual)
- Deliverables:
  - PR: Any necessary fixes
  - Notes: RLS policy checklist
- Exit Criteria:
  - No secrets in client; RLS/privilege posture confirmed

---

## Phase 9 — Documentation & Handover
- Status: Completed
- Scope: Finalize and reconcile docs with code realities
- Tasks:
  - Update `ai_docs/spec/*` if the cleanup implies clarification
  - Ensure `ai_docs/codebase_cleaning/*` reflects final state
  - Summarize diffs and outcomes
- Automation:
  - None (editorial)
- Deliverables:
  - PR: Doc updates
  - Final report in `CHANGELOG.md`
- Exit Criteria:
  - Docs align with codebase; onboarding path is clear

---

## Phase Gate Checklist (for each phase)
- Scope respected; no scope creep
- All tasks complete and checked in
- Scripts pass (typecheck, lint, build, grep)
- Manual smoke performed where relevant
- Docs updated in `ai_docs/codebase_cleaning`
- Exit criteria met and signed off

---

## Remaining Follow-ups (Post‑Cleanup Backlog)
- ESLint warning cleanup (non‑blocking):
  - Replace remaining `<img>` tags with Next `Image` where flagged.
  - Remove unused variables and fix `useEffect` dependency warnings in dashboard/marketing pages.
- Implement Phase 0 service stubs with real logic (scoped, later):
  - `libs/services/admin.ts` (admin detection/bootstrap)
  - `libs/services/credits.ts` (real usage/plan summary)
  - `libs/services/favorites.ts` (toggle/list default favorites)
  - `libs/services/profile.ts` (persist settings if required)
- (Optional) CI hardening:
  - Enforce grep check: no `createAdminClient` outside `app/api/v1/webhooks/**`.
  - Run typecheck/lint/build/test/verify:grep on PRs.
