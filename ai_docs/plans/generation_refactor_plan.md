# Generation Flow Refactor and Hardening Plan

## First-Principles Breakdown

- Problem We’re Solving
  - Turn a user’s intent (mode + inputs + prompt) into generated images via an external provider (Replicate), persist outputs, and present them reliably in a multi-user SaaS.
  - Core properties: correctness (no duplicates), reliability (retry-safe), scalability (many users), simplicity (few moving parts), and modularity (swap providers/models easily).

- Invariants We Must Maintain
  - Exactly-once “intent”: one click → one job, one usage debit, one set of outputs.
  - User isolation: each user’s state and limits enforced independently (RLS).
  - Contract stability: API requests/responses normalized and versioned.
  - Persist outputs under our control; do not depend on third-party URLs.

- Key Risks/Failure Modes
  - Double-creates on retries (network, user double-click) → duplicated jobs/billing.
  - Races between webhook and poll → stale UI, wrong status.
  - Webhook spoofing → malicious updates (signature verification required).
  - Multi-user spikes → rate limits; unpredictable latency.
  - Model/schema drift → broken inputs if adapter isn’t isolated.

- Architecture Trade-offs
  - Webhooks vs polling:
    - Webhooks are authoritative and cost-efficient; polling is a fallback UX aid.
    - Pure webhook (no polling) gives minimal infra but higher perceived latency if users navigate away; hybrid is pragmatic.
  - Concurrency controls:
    - App-level “one in-flight per user” simplifies UX; DB partial unique guarantees remove race windows.
  - Modularity:
    - Keep provider-specific details in a narrow adapter/provider; rest of app is provider-agnostic.

## Current State (Short Assessment)

- Flow: UI → POST /generations (multipart) → service (build prompt, moderate, upload, create prediction, create job+debit) → webhook updates job + stores assets → UI polls GET /generations/:id until variants present. This is sound.
- Polling: UI polls every 2s; server also polls Replicate once for stale (>5s) jobs. Webhook-first design is present.
- Concurrency: One in-flight per user enforced by service; DB has indexes and idempotency key uniqueness; no DB-level unique constraint to guarantee “one in-flight.”
- Idempotency: App-level via (owner_id, idempotency_key). Upstream idempotency header should also be used for Replicate create calls.
- Security: Webhook verifies HMAC, but header name must match Replicate’s (“X-Replicate-Signature”). Admin client only in webhooks (good).
- Modularity: We have a Replicate adapter; provider logic partly leaks into services. We can formalize a provider interface.
- Observability: Logs exist; minimal metrics; cleanup job flips stuck jobs.

## Decision Framework (What We’ll Evaluate)

- Efficiency: end-to-end latency, redundant polling, duplicate I/O.
- Correctness: race-free state transitions, idempotency guarantees (app + upstream).
- Modularity: can we swap model/provider with minimal changes?
- Multi-user safety: DB-level constraints and rate-limits; graceful degradation.
- Simplicity: prefer webhook-first; keep queues/workers out for MVP.

## Proposed Plan

1) Clarify and Normalize Contracts
- Unify request/response schemas:
  - Consolidate GenerationBody/FormData with `libs/api-utils/schemas.ts` shapes.
  - Single internal type for GenerationRequest used across route → service → provider adapter.
- Acceptance criteria:
  - One Zod schema per API entrypoint; all defaults centralized in runtime config.
  - All responses normalized; errors mapped to canonical codes.

2) Formalize Provider Abstraction
- Define `GenerationProvider` interface:
  - `submit(req): { providerPredictionId, status, submittedAt }`
  - `getStatus(providerPredictionId): { status, output?, error?, timestamps }`
  - `cancel(providerPredictionId): void`
  - `parseWebhook(rawRequest): { providerPredictionId, status, output?, error? }`
  - `mapInputs(internal: GenerationRequest): ProviderInput`
- Implement `ReplicateProvider`:
  - Encapsulate adapter/client; add upstream idempotency and error normalization.
- Wire services to use the provider (no SDK leakage outside).
- Acceptance criteria:
  - Swapping model or provider touches only provider module + runtime config mapping.

3) Idempotency and Concurrency Hardening
- Upstream idempotency:
  - Always set `Idempotency-Key` for create requests to Replicate.
- App idempotency:
  - Keep `(owner_id, idempotency_key)` unique index; return existing job on duplicates.
- DB-level one-in-flight guard:
  - Add partial unique index on `(owner_id)` WHERE `status IN ('starting','processing')`.
  - Map constraint violation to 409.
- Acceptance criteria:
  - Double-clicks, retries, restarts, and transient 5xx do not create duplicate jobs or debits.

4) Webhook-First, Polling-Second UX
- Webhook signature:
  - Verify “X-Replicate-Signature” HMAC-SHA256 over raw body; constant-time compare.
- Status transitions:
  - Webhook as source of truth; GET only polls Replicate if stale and non-terminal.
- UI polling optimization:
  - Keep 2s polling; stop immediately on terminal state.
- Optional later: SSE streaming if model supports it.
- Acceptance criteria:
  - Timely status flips; no infinite polling; no missed completion.

5) Prompt System and Input Mapping
- Centralize prompts in a single module; unit tests assert AU guardrails and per-mode cues.
- Adapter maps aspect ratios, variants, quality to provider fields; bounded by runtime config.
- Acceptance criteria:
  - Prompt builder & adapter tests pass; no hardcoded magic numbers.

6) Storage Pipeline Robustness
- Inputs: validate against runtime limits; private bucket convention.
- Outputs: download on webhook, store to `public/renders/<renderId>/<idx>.webp` with backoff retries; allow partial success.
- Cleanup: stuck job flip; idempotent webhook; detailed logging.
- Acceptance criteria:
  - Renders/variants consistent; storage paths predictable; no dangling jobs.

7) Multi-User and Plan Limits
- Enforce one in-flight at DB + service; clear 409 error path to UI.
- Quotas: monthly check via `usage_ledger`; debit on acceptance (idempotent); admin credit adjustments on failure if desired.
- Optional: gentle per-user rate-limits.
- Acceptance criteria:
  - Many users can submit concurrently; user-level rules consistent.

8) Observability and Operations
- Logging: lifecycle `{ jobId, ownerId, providerPredictionId, status }` at submit/webhook/update.
- Metrics: counters for submit/complete/fail; latency submit→completion; failure reasons.
- Alerts: failure rate spikes, webhook errors.
- Acceptance criteria:
  - Operators can quickly answer job status and failure causes.

9) Documentation and Change Safety
- Inline comments: idempotency strategy; webhook verification; handled events.
- Developer docs: provider integration guide.
- Acceptance criteria:
  - New contributors can swap model/provider with minimal guidance.

10) Clean-Up and De-risking
- Remove legacy/unused artifacts; align header names to constants; dedupe schemas.
- Acceptance criteria:
  - No drift between schema, services, and UI.

## Execution Plan (Phased)

- Phase A — Assessment & Contracts
  - Audit schemas in routes vs api-utils; consolidate.
  - Review webhook handler and header naming; record fixes.
  - Deliverables: schema consolidation, doc notes.

- Phase B — Provider Interface
  - Introduce `GenerationProvider` interface.
  - Implement `ReplicateProvider`; migrate service to provider.
  - Deliverables: provider module + service refactor (behavior stable).

- Phase C — Concurrency/Idempotency
  - Add DB partial unique index for one in-flight per user.
  - Ensure upstream idempotency header used consistently.
  - Map DB constraint to 409.
  - Deliverables: migration + service adaptation + docs.

- Phase D — Webhook & Polling Hardening
  - Align to “X-Replicate-Signature”; constant-time verification; logging.
  - Keep UI and server polling minimal and bounded.
  - Deliverables: webhook verification + polling hygiene.

- Phase E — Prompt & Adapter Tests
  - Add/complete unit tests for prompt builder and adapter mapping.
  - Deliverables: tests + links to runtime config.

- Phase F — Storage Resilience
  - Add retry/backoff to asset pipeline; partial success support.
  - Deliverables: resilient asset processing.

- Phase G — Observability
  - Standardize logs; add basic counters; document dashboards.
  - Deliverables: logs/metrics notes.

- Phase H — Cleanup & Docs
  - Remove unused artifacts; finalize provider/docs/idempotency notes.
  - Deliverables: clean repo + docs updates.

## Acceptance Checklist

- API responses normalized; validation is single-source.
- Provider abstraction in place; Replicate isolated; model swaps localized.
- Idempotency enforced app- and provider-side; one in-flight per user at DB.
- Webhook verified with correct header; handler idempotent; polling minimal.
- Outputs persisted under predictable paths; partial outputs handled.
- Multi-user concurrency and quotas enforced; observable logs exist.
- Tests pass; manual “Imagine” flow succeeds reliably.

## Implementation Tracking

- [x] Phase A — Assessment & Contracts (Schemas consolidated; added `accepted()` response; aligned webhook signature header to X-Replicate-Signature with constant-time HMAC; no breaking changes)
- [x] Phase B — Provider Interface (Introduced GenerationProvider; added ReplicateProvider encapsulating adapter/client; refactored generation service to use provider for submit + status; no behavior changes)
- [x] Phase C — Concurrency/Idempotency (Added partial unique index `uniq_jobs_owner_inflight` to enforce one in‑flight job per user; ensured server always assigns an idempotency key; refactored service to create the job before provider submit to acquire lock; mapped unique violation to 409-equivalent error path; upstream Idempotency‑Key already in place)
- [x] Phase D — Webhook & Polling Hardening (Aligned header to X‑Replicate‑Signature with constant‑time HMAC; added minimal in‑process throttle to server‑side stale polling to avoid excessive upstream calls; kept webhook‑first behavior; no UX changes)
- [x] Phase E — Prompt & Adapter Tests (Confirmed and retained unit tests under tests/ for prompt builder and adapter mapping; adapter refactor preserved function contracts; vitest config aligns with repo standards)
- [x] Phase F — Storage Resilience (Made asset processing idempotent; reuse existing render by job; skip existing variants; added retry+timeout on download and retry on upload; treat duplicate upload as success; only fail when no assets processed and no prior variants)
- [x] Phase G — Observability (Added structured JSON logger; instrumented submit/debit/poll in service; added webhook_received/processed/failure logs with durationMs; warning logs for missing job and no-output; non-breaking, low-overhead)
- [ ] Phase H — Cleanup & Docs
- [ ] Typecheck, lint, and build pass
- [ ] Forbidden grep checks return 0
- [ ] Manual submit→webhook→renders smoke passes
- [ ] Webhook signature verify validated against Replicate
