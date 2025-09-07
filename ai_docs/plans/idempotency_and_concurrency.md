# Idempotency and Concurrency — Generation Flow

## Goals

- Exactly-once intent per user action.
- Safe retries across browser/server/network layers.
- One in-flight job per user.

## App-Side Idempotency

- Client sends a UUID per submit (`idempotencyKey`).
- Server guarantees one exists (generates UUID if missing).
- DB has partial unique `(owner_id, idempotency_key)`; service returns existing job on duplicate.

## Upstream Idempotency

- The provider receives the same idempotency key via the `Idempotency-Key` header on prediction creation.
- Duplicate submits do not create new predictions upstream.

## One In-Flight Per User

- DB partial unique index `uniq_jobs_owner_inflight` on `(owner_id)` where `status IN ('starting','processing')`.
- Service inserts job (status `starting`) to acquire the lock before contacting the provider.
- If the insert fails with a unique violation, map to 409 (`TOO_MANY_INFLIGHT`).

## Webhooks and Polling

- Webhook-first: provider posts status updates; verified with HMAC.
- Minimal server-side polling as a fallback: throttled to avoid excess upstream calls.

## Storage Idempotency

- On webhook success: reuse existing render by `job_id` if present; skip variants that already exist.
- Duplicate uploads treated as success.

