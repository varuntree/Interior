# Phase 3 — Generations (Vertical Slice 1)

Purpose
- Deliver a complete, reliable generations flow: submit → provider (Replicate) → webhook → assets stored → job status/polling → variants available. Enforce plan limits, one in‑flight rule, idempotency, file constraints, and normalized API contracts. Keep it additive and in line with our route → service → repo boundaries.

Scope (What’s Included)
- API routes: `POST /api/v1/generations`, `GET|PATCH|DELETE /api/v1/generations/:id`
- Services: generation submission, status polling, cancellation, webhook handling
- Repositories: generation_jobs, renders, render_variants, usage_ledger
- Storage: private uploads for inputs; public outputs for results
- Provider adapter: Replicate (google/nano-banana)
- Enforcement: plan quota, one in‑flight, idempotency, file type/size
- Observability: structured logs at key transitions

Outcomes (Definition of Done)
- Submissions accept multipart/form-data; JSON accepted only without image uploads
- Generation submits promptly and returns 202 with `{ id, predictionId, status, settings }`
- Webhook stores assets under `public/renders/<renderId>/<idx>.jpg`, creates render + variants, and marks job terminal (succeeded/failed)
- Status GET reflects current state; if stale, polls provider once and updates DB
- Enforcement: one in‑flight per user; plan limits gated; idempotency on submissions and ledger debits
- Errors normalized (`TOO_MANY_INFLIGHT`, `LIMIT_EXCEEDED`, `VALIDATION_ERROR`, `UPSTREAM_ERROR`, `INTERNAL_ERROR`)

Execution Plan (Steps)
A) Contracts & Route Validation
- Ensure `app/api/v1/generations/route.ts` (POST):
  - Uses `withMethods(['POST'])`, returns `accepted()` (202), `dynamic = 'force-dynamic'`
  - Parses multipart form (files: input1/input2) or JSON (no files supported yet)
  - Validates schema via `generationFormDataSchema`/`generationRequestSchema`
  - Builds baseUrl via `getApplicationUrl(req)`
  - Calls `submitGeneration` service and maps known errors to response codes
- Ensure `app/api/v1/generations/[id]/route.ts`:
  - `GET`: loads job, refreshes stale non‑terminal via provider, includes variants on success
  - `PATCH { action: 'cancel' }`: cancels in‑progress jobs only
  - `DELETE`: deletes completed jobs’ renders (soft on assets per MVP)
  - Uses `withMethodsCtx`, `ok/fail`, and `dynamic = 'force-dynamic'`

B) Service Submission Flow
- Validate mode‑specific input presence; prompt rules; lightweight moderation
- Enforce one in‑flight pre‑check and at DB lock time (unique violation fallback)
- Compose prompt via `generation/prompts`
- Determine plan and remaining quota from `runtimeConfig.plans` + `usage_ledger`
- Upload inputs to `private/${userId}/inputs/<uuid>.<ext>` and create signed URLs (≈300s)
- Create `generation_jobs` row (status=starting) with idempotency key
- Submit to provider (Replicate) with absolute webhook URL
- Attach prediction_id, debit usage (idempotent meta), return job summary

C) Provider & Webhook
- Replicate provider (google/nano-banana): use adapter to map inputs
- Webhook `POST /api/v1/webhooks/replicate`:
  - Verify signature if secret present; otherwise accept
  - Normalize output (single URL or array) and store assets via `storage/assets`
  - Idempotent: skip existing variants; reuse existing render by job when present
  - Update job status and timestamps

D) Storage & Assets
- Inputs: private bucket per convention (`private/${userId}/inputs/...`)
- Outputs: `public/renders/${renderId}/${idx}.jpg` (thumb optional)
- Download/Upload uses retry with timeouts; treat existing objects as success (idempotency)
- Public URL construction for client via repo/service helpers

E) Status Polling & Stuck Protection
- GET status polls provider once when stale (>5s) and throttles subsequent polls per prediction id
- Job transitions logged with `{ ownerId, jobId, predictionId, status }`
- If jobs remain non‑terminal for > overallMs (from runtime config), UI encourages retry (MVP)

F) Usage & Limits
- Plan lookup by `profiles.price_id` → `runtimeConfig.plans[priceId]`, fallback to free
- monthlyGenerations enforced at submit; remaining computed from `usage_ledger`
- Debits recorded idempotently with `{ jobId, idempotencyKey }`

G) Logging & Observability
- Logs for submission, debit, webhook receipt/processed, poll updates, failures
- Don’t log PII; redact upstream errors in client responses

H) Verification & Smoke
- Typecheck, lint, and local build
- Manual submit (multipart) with a small image, ensure 202 accepted → status progresses → images appear in public renders → variants returned on GET
- Error paths: too many in‑flight; limit exceeded; validation errors; webhook no output
- Idempotency: repeat submit with same idempotency key → existing job returned; duplicate webhook safe

Detailed Task List (Granular)
- [x] Routes — POST /api/v1/generations contract verified; schemas and error mapping intact
- [x] Routes — GET/PATCH/DELETE /api/v1/generations/:id behavior verified; no direct repo imports
- [x] Service — submitGeneration: moderation, validation, locks, uploads, provider submit, debit usage
- [x] Service — getGeneration: stale poll, throttle, normalized response (plus stuck timeout)
- [x] Service — cancelGeneration: in‑progress only
- [x] Webhook — signature verify (if env set), idempotent processing, asset storage, status updates
- [x] Storage — input upload constraints (size/types), signed URL TTL, output path conventions
- [x] Repositories — generation_jobs/renders/variants/usage cover queries and idempotency
- [x] Logging — present at key steps
- [x] Smoke — ready for manual: happy path, limit exceeded, inflight block, failure handling

Files Expected to Touch/Verify
- app/api/v1/generations/route.ts
- app/api/v1/generations/[id]/route.ts
- app/api/v1/webhooks/replicate/route.ts
- libs/services/generation.ts, libs/services/generation_webhooks.ts
- libs/services/providers/*, libs/services/external/*
- libs/services/storage/{uploads,assets}.ts
- libs/repositories/{generation_jobs,renders,usage}.ts
- libs/api-utils/{schemas,responses,methods}

Risks & Rollback
- Provider schema drift: adapter isolates changes; keep tests for adapter mapping
- Webhook retries/duplicates: idempotent logic prevents duplicate DB/storage writes
- Storage failures: retries with backoff; treat existing objects as success where safe
- Rollback: changes are mostly behavioral; revert services/routes if required

Result (fill on completion)
- Date:
- Branch/Commit:
- Summary of changes and validations:
- Notes:
