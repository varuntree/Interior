# Phase 4 — Webhooks & Idempotency (Horizontal)

Purpose
- Make all inbound webhook handling safe to replay and resilient to duplicates or out‑of‑order delivery, while keeping service‑role usage limited strictly to webhooks. Ensure signature verification, error isolation, and clear, minimal logging. No behavioral changes to user‑facing contracts; only robustness and guardrails.

Scope (What’s Included)
- Replicate webhook: `/api/v1/webhooks/replicate`
- Stripe webhook: `/api/v1/webhooks/stripe` (+ legacy re‑export at `/api/webhook/stripe`)
- Idempotency primitives at service/repo/storage layers
- Service‑role client usage boundaries
- Observability: structured, minimal logs; no PII leakage

Outcomes (Definition of Done)
- Replicate webhook
  - Signature verification enforced when secret configured
  - Idempotent processing (safe to replay) — creating no duplicate renders/variants, safe job status updates
  - Errors do not cause retry storms; handler returns 200 with internal logging on failures
- Stripe webhook
  - Signature verification required
  - Idempotent processing guarded by event.id de‑duplication (persistent record)
  - Updates to profiles and access flags are replay‑safe
- Service‑role usage restricted strictly to webhooks (and admin exceptions documented)
- Logs include minimal correlation fields (predictionId, event.id) and no sensitive user data

Current State (Audit Summary)
- Replicate webhook (OK):
  - Route: `app/api/v1/webhooks/replicate/route.ts` verifies signature (when REPLICATE_WEBHOOK_SECRET) and delegates to `libs/services/generation_webhooks.ts`.
  - Service: `generation_webhooks.handleReplicateWebhook` normalizes output, reuses existing render per job, skips existing variants by idx, and updates job status. Asset store is idempotent (treats existing object as success). Returns 200 on internal errors to avoid retries. Logs via `logger`.
  - Service‑role: uses `createAdminClient` inside webhook route only.
- Stripe webhook (partially OK):
  - Route: `app/api/v1/webhooks/stripe/route.ts` verifies signature and delegates to `libs/services/billing.handleStripeWebhookService` using admin client. Legacy route re‑exports POST handler.
  - Service: updates billing records according to event types (checkout.session.completed, subscription.updated/deleted, invoice events). Operations are mostly idempotent (setters), but no explicit event.id de‑duplication store exists.
  - Service‑role: used correctly inside webhook route.
- Admin endpoints: limited to `/api/v1/admin/**` with allowlist; use non‑admin service client (compliant with boundary rule).

Execution Plan (Steps)
A) Replicate Webhook — Idempotency & Safety
- Validate signature on every request when secret present
- Keep handler idempotent: skip if job not found; do not duplicate renders/variants (use repo checks); safe to replay
- Return 200 for any internal error to avoid noisy retries; log errors with predictionId
- Ensure storage upload treats “already exists” as success; keep retry/backoff for network operations

B) Stripe Webhook — Idempotency by Event ID
- Verify signature via Stripe library
- Introduce persistent de‑duplication keyed by `event.id` (e.g., `webhook_events` table with unique index on `(provider, event_id)`)
- Guard handler to early‑exit on duplicate events; keep setter updates idempotent
- Log event.id with minimal context

C) Service‑Role Client Boundaries
- Verify only `/api/v1/webhooks/**` routes import `createAdminClient`
- Confirm `/api/v1/admin/**` routes use non‑admin service client and remain allowlist‑gated

D) Observability & Error Policy
- Ensure logs include `{ predictionId }` for Replicate and `{ eventId }` for Stripe
- Avoid logging PII; redact upstream error details from client responses
- Keep webhook responses 200 even on internal failures; rely on internal alerts/logs

E) Verification & Smoke
- Replicate: replay webhook payloads (succeeded/failed) twice → no duplicates, stable status, correct asset storage
- Stripe: send duplicate events (same `event.id`) → handler exits early; plan/access flags remain consistent
- Boundary checks: grep for admin client imports only under `/api/v1/webhooks/**`

Detailed Task List (Granular)
- [x] Replicate: signature verification enabled; idempotent handler (skip/exists logic) verified
- [x] Replicate: storage idempotency and retry/backoff validated
- [x] Stripe: add event de‑duplication (DB table + check) to handler service; early exit on duplicates
- [x] Stripe: verify signature; surface only sanitized errors
- [x] Boundaries: service‑role imports limited to webhooks; admin endpoints documented as exception
- [x] Logs: include predictionId/event.id; avoid PII
- [ ] Smoke: replay scenarios tested manually (dev/CI harness)

Files Expected to Touch/Verify
- app/api/v1/webhooks/replicate/route.ts
- app/api/v1/webhooks/stripe/route.ts and `app/api/webhook/stripe/route.ts` (re‑export)
- libs/services/generation_webhooks.ts
- libs/services/storage/assets.ts
- libs/services/billing.ts (Stripe events)
- libs/supabase/admin.ts (ensure only webhooks import)
- migrations (for Stripe event de‑duplication table)

Risks & Rollback
- Over‑strict signature enforcement may break dev if env is missing; keep secret optional in dev
- De‑dup table must be idempotent to insert and safe to query under concurrency
- If provider schemas change, adapter/services must continue to normalize fields

Result (fill on completion)
- Date:
- Branch/Commit:
- Summary of changes and validations:
- Notes:
