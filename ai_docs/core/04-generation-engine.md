# Generation Engine — Interior Design Generator (Core)

Purpose
- Describe how prompts are composed, how inputs map to the external model (Replicate → google/nano‑banana), and how jobs move from submit to results. Keep model specifics in adapters so we can swap/upgrade without rippling changes. This doc is contract‑first with essential snippets only.

Internal Types & Settings (Mental Model)
- A submission carries: `mode` (redesign|staging|compose|imagine), optional `prompt`, `roomType`, `style`, and optional image inputs depending on mode.
- Services normalize to a GenerationRequest with storage paths for inputs (private bucket), a composed prompt string, and the user’s id. Limits and defaults come from `libs/app-config/runtime.ts` (single source of truth).

Prompt System (Centralized, Generalized)
- Centralized Prompt Engine (v2) composes concise, country‑agnostic prompts per mode. Shared guardrails (structure‑keeping modes): “Photoreal interior render, correct perspective, realistic lighting. Keep existing room architecture unchanged; do not alter structural layout, camera/view direction, or window positions.”
- Mode intents:
  - Redesign: restyle furnishings/palette without changing architecture.
  - Staging: assume empty/under‑furnished; add tasteful furniture; retain overall color mood and lighting.
  - Compose: first image is base room (keep structure); second image is style/object reference; transfer palette/object; harmonize lighting/perspective.
  - Imagine: interior‑only concept; user prompt optional; engine falls back to presets when empty.
- Negative constraints are embedded in the prompt (no humans/people/faces, no text/watermarks/logos).
- Style/room seeds are short, neutral descriptors sourced from runtime config; no geographic context is included.

Adapter Mapping (Internal → Replicate)
- Single adapter shapes model inputs so services never depend on vendor fields. Current mappings (google/nano‑banana):
  - `prompt` → composed prompt string.
  - `image_input` → signed URLs array for image inputs (0–2 based on mode).
  - `output_format` → 'jpg' for efficient delivery.
- Keep model‑specific field names only in `libs/services/external/googleNanoBananaAdapter.ts`. Services pass internal types only.

Submission Flow (Service Contract)
- Validate mode‑specific inputs. Run lightweight moderation on user‑supplied text (if present) and required image presence per mode.
- Enforce one in‑flight job per user (status in starting|processing); reject with 409 on violation.
- Check plan quota: derive plan by `profiles.price_id` and map to runtime plans; compute remaining from `usage_ledger` debits/credits for current month; reject with 402/429 when 0.
- Upload inputs to `private/${userId}/inputs/<uuid>.<ext>` via Supabase Storage; generate short‑lived signed URLs (~300s) for Replicate only.
- Compose final prompt via Prompt Engine v2: mode template + guardrails + negatives + optional style/room seeds + optional user text (generalized; no geography).
- Build Replicate inputs via adapter; construct absolute webhook URL using base URL + `runtime.replicate.webhookRelativePath`.
- Create prediction with retries on transient errors; persist `generation_jobs` row (status='starting', prediction_id, settings, inputs, prompt, idempotency_key). Insert usage debit with idempotency metadata.
- Return a job summary `{ id, predictionId, status, settings }` and let the UI poll GET by id while waiting for the webhook.

Webhook Processing (Idempotent)
- Verify signature when configured; otherwise constrain via infra. Load job by prediction id; if not found, no‑op success.
- On `succeeded`: create a `renders` row inheriting mode/room/style; download each output URL and write to `public/renders/<renderId>/<idx>.jpg`; insert `render_variants` rows; mark job `succeeded` with `completed_at`.
- On `failed|canceled`: mark job terminal with normalized `error` and `completed_at`. All actions must be repeat‑safe.

Status & Polling (GET by Id)
- If non‑terminal and stale (>~5s), poll Replicate once (by prediction id) to refresh status and timestamps. When terminal and succeeded, include the result image with public URL derived from storage paths. Keep responses small.

Moderation & Validation (Lightweight)
- Prompt moderation rejects explicit, hateful, violent, illegal, or PII‑like content via simple patterns and repetition checks; returns a generic message on rejection. Image inputs are validated per mode (Compose needs two, Redesign/Staging need one, Imagine needs none). Keep rules minimal and fast.

Edge Behavior & Limits
- Accepted MIME types and max upload size are enforced server‑side on uploads and reflected in the UI. Outputs use `.jpg` for size/perf; thumbnails are optional and can be added later without changing contracts.

Tiny Snippets (for implementers)
- Replicate fields used now: `{ prompt, image_input?, output_format? }`.
- Job statuses we rely on: `starting → processing → succeeded|failed|canceled`. Webhook events listened: start, output, logs, completed.

Cross‑References
- For schemas, RLS, and storage paths: see 03 Data & Storage. For API endpoints providing submit/status/webhooks: see 05 API. For UI contracts and states: see 01 Overview & UX. For runtime knobs: see 02 Architecture & Guidelines.
