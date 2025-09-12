# CodeBase Cleaning — Index & Phase Tracker

This document orients any fresh session (new assistant instance) to the cleanup effort. It provides essential context, links to the two source documents, and a phase‑by‑phase tracker so work is never duplicated or left stale.

Read this top‑to‑bottom before starting a phase.

## Why This Exists
- Each phase may be executed in a new session without prior chat history.
- This file gives you a compact “what and why”, and points you to the two canonical documents you must read to regain full context.
- It also tracks progress so we don’t redo work across sessions.

## Must‑Read Documents
1) Principles (what “good” looks like)
   - `agent/CodeBaseCleaning/01-principles.md`
   - Focus: layering, contracts, storage, security, idempotency, performance, DX, and indie‑friendly tradeoffs.

2) Plan (how we implement it, step‑by‑step)
   - `agent/CodeBaseCleaning/02-plan.md`
   - Focus: hybrid execution model, phases 0–11, with clear Definition of Done for each.

You must read both before starting any phase.

## Before You Start Any Phase (Fresh Session Checklist)
1. Run the Prime Command
   - Open and follow: `agents/prompts/prime.md`
   - Purpose: load product context, specs, architecture, data models, and codebase tree in your head.

2. Re‑read the Principles and Plan
   - `agent/CodeBaseCleaning/01-principles.md`
   - `agent/CodeBaseCleaning/02-plan.md`
   - Keep them open as your guardrails. Do not introduce features.

3. Confirm Environment
   - Ensure local `.env.local` exists and matches non‑secret config in `config.ts`.
   - Do not use service‑role keys except in webhooks.
   - Never import secrets into client bundles.

4. Guardrails Reminder
   - No Server Actions; no direct DB from components.
   - Routes validate with Zod, enforce HTTP method, and return normalized `ApiResponse<T>`.
   - Services are stateless, pure functions; repositories are pure DB accessors.

## Scope of the Cleanup
We are not adding features. We are:
- Standardizing structure and API contracts.
- Enforcing security posture (RLS, secrets handling) and idempotency.
- Improving maintainability and readability without over‑engineering.
- Making performance sane (indexes, image discipline, no N+1), not micro‑optimizing.

## Phase Tracker
Mark progress with `[ ]` → `[x]`. Include date and brief notes.

- [x] Phase 0 — Freeze & Guardrails
  - [x] Feature freeze declared
  - [x] ESLint import boundaries in place
  - [x] Guard scripts for forbidden patterns added
  - [x] PR template with DoD checklist added
  - Notes:
    - Added ESLint overrides enforcing boundaries:
      - components/: disallow Supabase SDK, repositories, server/admin clients
      - app/api/: disallow repositories and admin client (routes call services; admin only in webhooks/admin)
      - libs/services/: disallow admin client usage
    - Added `scripts/verify-phase0.sh` and npm script `verify:phase0` to run typecheck, lint, build, and guard checks
    - Extended `verify:grep` with additional advisory scans (Supabase SDK in components, route→repo, admin misuse)
    - Added `.github/PULL_REQUEST_TEMPLATE.md` with DoD checklist
    - Audit: one known route→repo import at `app/api/v1/community/collections/route.ts` recorded for Phase 1
    - No API contract changes; guardrails only

- [ ] Phase 1 — Foundations (Core Utilities & Contracts)
  - [x] `ApiResponse<T>` helpers and error taxonomy added
  - [x] `withMethods` + validation wrapper added and adopted by new/updated routes
  - [x] Strict `env` parser created; `config.ts` remains non‑secret
  - [x] Supabase wrappers (SSR/browser) and storage scaffolding added
  - [x] DTOs/mappers (`types/api`, `types/domain`) established
  - [~] Logger with correlation IDs (request/job/webhook) wired (added request id header in usage route)
  - Notes:
    - Normalized error handling in 5 routes to use `fail()`
    - Added `dynamic = 'force-dynamic'` to dynamic/auth routes touched
    - Fixed route→service boundary for community collections; removed ESLint override
    - Added `normalize-error` helper (available for future adoption)
    - Added DTOs under `types/api/` for usage, renders, collections
    - Added `with-request` helper and applied to `/api/v1/usage` (x-request-id header)

- [x] Phase 2 — Frontend Consistency (Horizontal)
  - [x] Component layering directories established (`ui`, `shared`, domain components retained)
  - [x] Typed fetch utility adopted; no Server Actions/DB in components
  - [x] Standard states (idle/submitting/processing/succeeded/failed) and toasts unified
  - [x] Image wrapper with constrained sizes + lazy‑loading in use
  - Notes:
    - Added components/shared: AppImage, Async helpers, Toast, Empty, Loading (re‑exports)
    - Replaced raw fetch with apiFetch in generator and key dashboard pages (community, settings, history)
    - Adopted AppImage in ResultCard and RenderCard to avoid layout shift and ensure lazy loading
    - Standardized toasts via shared helpers; generator progress toasts consistent
    - No API/contracts changed; purely frontend consistency and composables

- [x] Phase 3 — Generations (Vertical Slice 1)
  - [x] `POST /api/v1/generations` and `GET|PATCH|DELETE /api/v1/generations/:id` use shared helpers
  - [x] Usage gating (`LIMIT_EXCEEDED`) enforced from runtime config plans
  - [x] One in‑flight guard (`TOO_MANY_INFLIGHT`) implemented
  - [x] Idempotency via `idempotencyKey` and DB uniqueness
  - [x] Upload constraints (type/size); JSON with file URLs not accepted (multipart only for files)
  - [x] Storage: private inputs; signed URL TTL ≈ 5 min; public outputs
  - [x] Stuck job failover (uses runtime overallMs) on GET poll
  - [x] Logs include `ownerId`, `jobId`, `predictionId`; no PII
  - Notes:
    - Added server‑side file validation in POST route using shared schemas
    - Added stuck timeout handling in getGeneration based on runtimeConfig
    - Webhook remains idempotent; assets stored in public/renders/<renderId>/<idx>.jpg

- [x] Phase 4 — Webhooks & Idempotency
  - [x] Replicate webhook: signature verify (if available), idempotent processing
  - [x] Stripe webhook: signature verify, idempotent by event id (webhook_events table)
  - [x] Service‑role keys used only in webhooks
  - [x] Correlation fields propagated in logs
  - Notes:
    - Added migrations/0002_webhook_events.sql for persistent de‑dup store
    - Implemented event de‑dup check in billing webhook service using repo helper

- [x] Phase 5 — Renders (Vertical Slice 2)
  - [x] List and detail via API; pagination/filters in place
  - [x] No N+1; indexes (`owner+created_at`, `render_id+idx`) confirmed
  - [x] Storage paths `public/renders/${renderId}/${variantIndex}.jpg`
  - [x] Frontend uses image wrapper and lazy load
  - Notes:
    - Added repo batch helper `getVariantsByRenderIds` and server-side `searchRenders` (ilike)
    - Refactored `services/renders.listUserRenders` and `searchRenders` to batch cover lookups and favorites membership
    - API contract unchanged; route already supported cursor/filters; search now server-side
    - UI: added pagination (Load more) via `useRenders` and renders page; lazy images unchanged

- [ ] Phase 6 — Collections (Vertical Slice 3)
  - [x] CRUD endpoints normalized; default “My Favorites” semantics enforced
  - [x] Idempotent add/remove; rely on RLS for owner checks
  - [x] Optimistic UI wired with normalized errors
  - [x] Collections detail reuses centralized RenderCard/AppImage
  - [x] Removed N+1 in getCollectionWithItems via batch variant fetch
  - [x] Added optional items pagination (Load more)
  - Notes:
    - Service now batches cover variant lookup using renders.getVariantsByRenderIds
    - UI detail grid replaced with RenderCard; added CollectionPickerDialog and favorite toggle wiring
    - useCollectionDetail supports Load more via /collections/:id/items with limit/offset

- [x] Phase 7 — Community (Vertical Slice 4)
  - [x] Read‑only user endpoints; admin out of UI
  - [x] Public storage `public/community/*` + cache headers
  - [x] Community UI uses centralized AppImage; lazy images
  - Notes:
    - CommunityItem now uses components/shared/Image (AppImage) instead of next/image
    - Public API keeps CACHE_CONFIGS.PUBLIC; added search length clamp
    - Admin endpoints remain allowlist‑gated and server‑only

- [x] Phase 8 — Payments & Legacy Delegation (Vertical Slice 5)
  - [x] Legacy routes delegate to v1 services cleanly
  - [x] Usage ledger side effects centralized; Generations continues gating
  - [x] BillingSection uses config-driven priceId (no hard-coded IDs)
  - Notes:
    - UI now selects featured plan from config.stripe.plans for checkout
    - Stripe webhook remains idempotent via event store; legacy paths re-export v1

- [ ] Phase 9 — Performance & Build Health
  - [ ] Zero Next build warnings
  - [ ] No large optional deps in client; dynamic imports if needed
  - [ ] API routes quick; upstream timeouts + minimal retries
  - [ ] Image discipline: streaming uploads; thumbs optional
  - Notes:

- [ ] Phase 10 — Observability & Logging (Finalize)
  - [ ] Standard log fields everywhere (trace/request, user, job, prediction)
  - [ ] Upstream errors redacted for clients; details server‑only
  - Notes:

- [ ] Phase 11 — Docs & Final Sweep
  - [ ] `ai_docs` PRD/API/Data updated if deltas
  - [ ] Dead code and unused deps removed; guard scripts confirmed
  - [ ] Import boundaries validated
  - Notes:

## Working Notes Template (Per Phase)
Use this section during a phase to keep state minimal and portable.

- Phase:
- Date/Time:
- Branch/Commit:
- Files touched:
- Decisions made (copy to ADR later if notable):
- Risks/rollbacks:
- Hand‑off notes for next session:

## Quick Reference (Do Not Drift)
- Architecture direction: UI → API route → service → repository → DB/Storage.
- Never: Server Actions; direct DB calls from components; service‑role outside webhooks.
- Always: Zod validation in routes; normalized `ApiResponse<T>`; method enforcement; pure services/repos.
- Storage: inputs private per‑user; outputs under `public/renders/` with predictable paths.
- Idempotency: `idempotencyKey` for create paths; webhook upsert by stable external id.
- Secrets: env only, never in client bundles.
