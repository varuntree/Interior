# Codebase Cleaning Plan (Hybrid, End‑to‑End)

Execution model: Hybrid approach. Lay horizontal guardrails once, then refactor vertical domains fully (no partial migrations). Additive and non‑destructive: do not move/delete “do‑not‑touch” assets; add new structure and migrate callers gradually. Every step keeps main green; no TODOs left behind. No test implementation included in this plan.

## Phase 0 — Freeze & Guardrails
- Feature freeze: cleanup only; no new features.
- Import boundaries: ESLint “no‑restricted‑imports” for layers (UI → API → services → repos only).
- Forbidden patterns: guard scripts to block Server Actions, direct DB in components, and service‑role usage outside webhooks.
- PR hygiene: lightweight PR template + Definition of Done checklist.
- DoD: guards runnable and enforced; typecheck/build must pass; no Server Actions or forbidden imports.

## Phase 1 — Foundations (Core Utilities & Contracts)
- Responses/errors: single `ApiResponse<T>` helpers; canonical error codes → HTTP status mapping.
- Validation/methods: Zod schema pattern + `withMethods` wrapper mandatory for all routes.
- Env/config: strict server‑side parser; central non‑secret `config.ts`; ban secrets in client bundles.
- Supabase & storage: SSR/browser clients wrappers; storage helper scaffolding (upload, signed URL).
- DTOs/mappers: `types/api` (transport) and `types/domain` (internal) + tiny mappers to avoid contract drift.
- Logger & correlation ID: minimal logger with request/job/webhook IDs passed through routes → services → webhooks.
- DoD: helpers exist and are imported by new/updated routes; env parsed; logger wired; no client secrets.

## Phase 2 — Frontend Consistency (Horizontal)
- Components layering: `components/ui` (primitives), `components/shared` (composables like Dropzone, Skeleton, Empty, Error, Toast), `components/features/<domain>/*`.
- Data access: single typed fetch util; no SWR (keep it simple); no DB calls or Server Actions in components.
- UX states: uniform idle/submitting/processing/succeeded/failed patterns and toasts; accessible inputs and focus rings.
- Image discipline: shared Image wrapper (Next/Image) with constrained sizes, lazy loading, and no layout shift.
- DoD: generator/dashboard screens use shared blocks and typed fetch; consistent loading and error UX; no direct DB calls.

## Phase 3 — Generations (Vertical Slice 1)
- Routes: `POST /api/v1/generations`, `GET /api/v1/generations/:id` using shared validation/response/method wrappers.
- Usage gating: enforce credits/limits from `config.ts` here (not later); return `LIMIT_EXCEEDED` when applicable.
- One in‑flight guard: 409 `TOO_MANY_INFLIGHT` for concurrent jobs.
- Idempotency: accept `idempotencyKey` and honor partial unique index (owner, key).
- Upload constraints: accept only JPG/PNG/WebP; size cap (e.g., 10MB); basic sniffing; reject base64 in JSON.
- Storage: inputs → `private/${userId}/inputs/<uuid>.<ext>`; signed URL TTL ~5 minutes (min necessary).
- Replicate adapter: create prediction with webhook URL; store `prediction_id`.
- Stuck jobs: if non‑terminal and >10 min, mark failed with friendly message on next GET poll.
- Logging: include `userId`, `jobId`, `predictionId` in all transitions; do not log PII or raw errors.
- DoD: submit→poll path works with normalized responses; limits and in‑flight guards enforced; uploads validated; TTL set; stuck behavior implemented.

## Phase 4 — Webhooks & Idempotency (Early, Horizontal)
- Replicate webhook: verify signature if available; upsert by `prediction_id`; idempotent on duplicates.
- Stripe webhook: verify signature; no user‑visible changes beyond ledger/profile updates; idempotent by event id.
- Service‑role keys: only webhooks use them; never in UI or general APIs.
- Correlation: propagate webhook `prediction_id` or `event_id` through logs.
- DoD: replay‑safe; duplicate events produce no duplicates or side effects; minimal, safe logging.

## Phase 5 — Renders (Vertical Slice 2)
- Routes: list renders with pagination/filters; fetch variants without N+1; owner‑scoped reads via RLS.
- Repos: `renders`, `render_variants` with proper indexes (owner+created_at, render_id+idx).
- Storage paths: `public/renders/${renderId}/${variantIndex}.jpg` (thumb optional).
- Frontend: renders page uses image wrapper and lazy loading; stable layout.
- DoD: paginated, fast listing via API; no N+1; paths consistent and renderable.

## Phase 6 — Collections (Vertical Slice 3)
- Routes: create/rename/delete collections; add/remove items; enforce default “My Favorites” presence semantics.
- Service: idempotent add/remove; owner checks assumed via RLS.
- Frontend: optimistic “Add to Favorites” with safe error normalization.
- DoD: full CRUD works end‑to‑end via API; optimistic UX behaves correctly.

## Phase 7 — Community (Vertical Slice 4)
- Read‑only user endpoints; admin curation remains out of UI and limited to controlled paths.
- Storage: `public/community/<uuid>.<ext>`; set suitable cache headers for public reads (e.g., public, max‑age).
- DoD: community grid loads predictably; correct caching headers; no write access for users.

## Phase 8 — Payments & Legacy Delegation (Vertical Slice 5)
- Legacy routes: `create-checkout`, `create-portal` delegate to v1 services (thin adapters).
- Usage ledger: any side effects centralized; Generations continues to do gating using config.
- DoD: upgrade/portal flows function; no secrets leak; delegation clean.

## Phase 9 — Performance & Build Health (Horizontal)
- Build: zero Next warnings; no large optional deps on client; dynamic import for hefty UI modules if any.
- API: ensure no N+1; indexes confirmed; upstream timeouts with minimal retries (no complex backoff).
- Images: streaming uploads; previews via CSS scale; thumbs remain optional.
- DoD: clean build; responsive UI stays smooth; representative routes are quick.

## Phase 10 — Observability & Logging (Finalize)
- Standard fields: `traceId`/`requestId`, `userId`, `jobId`, `predictionId`; uniform format.
- Error redaction: upstream errors condensed to safe messages; internals logged server‑side only.
- DoD: consistent logs across routes/services/webhooks; no PII leakage.

## Phase 11 — Docs & Final Sweep
- Specs: update `ai_docs` PRD/API/Data if any deltas; brief ADR notes for decisions.
- Housekeeping: remove dead code, unused deps; confirm guard scripts; ensure import boundaries.
- DoD: docs aligned; repo tidy; guards in place; no leftover TODOs.

## Intentionally Excluded
- No unit/integration tests, smoke scripts, or test harnesses will be added in this plan.
- No containerization, queues, or workers; we rely on Replicate/Supabase primitives.

