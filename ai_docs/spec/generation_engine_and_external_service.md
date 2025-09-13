0) Purpose
Defines the generation engine (prompts, presets, parameter mapping), the adapter to Replicate (google/nano‑banana), and the webhook flow. Keeps MVP simple, reliable, and aligned with our “one in‑flight per user, async via webhook” strategy.

1) Interfaces (internal types)
ts
Copy
// Internal request coming from route after validation
type Mode = 'redesign' | 'staging' | 'compose' | 'imagine';

type GenerationRequest = {
  ownerId: string;
  mode: Mode;
  prompt?: string;                 // required for 'imagine'
  roomType?: string;               // preset dropdown
  style?: string;                  // preset dropdown
  input1Path?: string;             // storage path (private bucket)
  input2Path?: string;             // for 'compose'
  idempotencyKey?: string;         // UUID
};
Route handler → builds GenerationRequest → calls GenerationService.

2) Prompt system (mode templates)
We construct a final prompt as:

css
Copy
[Mode Guardrails] + [AU style context] + [Room Type context] + [User Prompt (optional)]
2.1 Constants
Shared guardrails (Redesign/Staging/Compose):

“Photoreal interior render, correct perspective, realistic lighting.”

“Keep existing room architecture: walls, windows, doors, floors, ceiling height and wall positions unchanged.”

“Do not alter structural layout, view direction, or window positions.”

AU context booster:

“Use materials and furnishings commonly found in Australian homes.”

“Respect local light quality: bright, airy daylight.”

Style seeds (examples; editable in config):

Coastal AU — light timbers, white walls, linen textures, pale blues/greens.

Contemporary AU — clean lines, matte finishes, warm neutral palette.

Japandi — minimal, natural woods, soft contrast.

Scandi AU — light oak, white, soft greys, cozy textiles.

Minimal AU — restrained palette, functional layout.

Mid‑Century AU — teak, low profiles, muted color pops.

Industrial AU — concrete, metal accents, leather.

2.2 Per‑mode templates
Redesign

css
Copy
Keep room structure. Restyle furnishings, decor, color palette and finishes.
Style: {style}. Room type: {roomType}. Australian context. {userPrompt?}
Staging

pgsql
Copy
Assume the room may be empty or under-furnished. Add tasteful furniture and decor appropriate for {style}, for a {roomType} in an Australian home. Do not move walls/doors/windows. {userPrompt?}
Compose (two inputs)

csharp
Copy
Use the first image as the base room; keep its architecture intact.
Use the second image only as style/reference for palette, materials, or the specified object.
Harmonize lighting and perspective. {style?} {roomType?} {userPrompt?}
Imagine (text-only)

arduino
Copy
Generate a photoreal interior concept for a {roomType} in {style} for an Australian home. Balanced composition, realistic materials, natural light. {userPrompt}
The exact strings live in code as constants so we can iterate without schema changes.

3) Parameter mapping (internal → Replicate model)
We keep an adapter so model switches/updates don’t spill into the rest of the app.

Runtime adapter: libs/services/external/googleNanoBananaAdapter.ts
Function: toGoogleNanoBananaInputs(req: GenerationRequest, signedInputUrls: string[], opts?): { prompt, image_input?, output_format? }

Guidelines:

- Images: pass up to two signed image URLs as `image_input` when present.
- Prompt: the composed prompt (templates above + user text).
- Output format: set `output_format: 'jpg'` for efficient storage/delivery.

Notes:

- Legacy knobs (aspect ratio, quality, variants) are not used by the current provider and are omitted.
- All model‑specific field names live only in the adapter; elsewhere we use our internal shape (GenerationRequest).

4) Generation service (business logic)
File: libs/services/generation.ts

4.1 submitGeneration(ctx, req: GenerationRequest) -> { id, predictionId, status, settings }
Steps:

Inflight check: if exists job status in (starting, processing) for owner → throw TOO_MANY_INFLIGHT.

Credits check: compute remaining for the month from usage_ledger + plan; if 0 → LIMIT_EXCEEDED.

Uploads:

If input1Path/2Path are not already set, store uploads in private/…/inputs.

Create signed URLs (60–300s) for Replicate.

Prompt: build using mode template + AU context + presets + user prompt.

Replicate:

Build inputs via replicateAdapter.toReplicateInputs.

Create prediction with webhook pointing to /api/v1/webhooks/replicate.

Capture prediction_id.

Persist job:

Insert into generation_jobs with status = 'starting', prediction_id.

Apply idempotency: if idempotencyKey present and an identical open job exists, return the existing job.

Debit usage: insert ledger row { kind: 'generation_debit', amount: 1, meta: { jobId } }.

Return job summary { id, predictionId, status, settings }.

4.2 getGeneration(ctx, jobId) -> JobWithOutputs
Steps:

Load job by id (owner‑scoped).

If status not terminal and stale (>5s), poll Replicate once by prediction_id and upsert status/error.

If succeeded: join associated renders and render_variants for URLs.

Return normalized payload.

5) Webhook processing
Route: POST /api/v1/webhooks/replicate
Client: service-role supabase admin (webhook only).

5.1 Verification
Validate signature per Replicate’s webhook guide using a signing secret stored in env (e.g., REPLICATE_WEBHOOK_SECRET). If verification isn’t configured, accept only from Replicate’s IPs or add a shared token as a header. (We’ll choose signature verify if available.)

5.2 Payload (normalized)
We only rely on a minimal set of fields:

json
Copy
{
  "id": "replicate_prediction_id",
  "status": "succeeded|failed|processing|starting",
  "output": "https://.../0.jpg",
  "error": null
}
5.3 Actions
Find job by prediction_id. If not found → 200 OK (idempotent no‑op).

If status = succeeded:

Create a render row (inherits mode, roomType, style from job).

For each output URL:

Download and store to public/renders/<renderId>/<idx>.jpg.

Optionally generate a _thumb.webp.

Insert render_variants rows.

Update job { status: 'succeeded', completed_at: now() }.

If status = failed:

Update job { status: 'failed', error: normalizedMessage, completed_at: now() }.

Return 200 { success: true }. The handler is idempotent (safe to receive duplicates).

6) API contracts (quick reference)
POST /api/v1/generations (multipart or JSON)
Validates mode‑based required inputs.

Enforces inflight + credits.

Returns 202 { id, predictionId, status, settings }.

GET /api/v1/generations/:id
Returns current status; if succeeded, includes variants[] (URLs).

Webhook /api/v1/webhooks/replicate
Sets terminal status and persists images.

Detailed request/response shapes are in system_architecture_and_api.md §6 and are unchanged here.

7) Content moderation (lightweight)
Before submit, run a minimal ruleset:

Reject clearly disallowed content (e.g., explicit, hateful, illegal).

Map to 400 VALIDATION_ERROR with a generic message.
This is a simple text check on prompt (no heavy service). We can expand later if needed.

8) Variants behavior
The current model typically returns a single output URL. If upstream returns multiple outputs, we store each as a variant; if fewer than expected, we store what we have and log a warning.

9) Timeouts & retries
Submit path retries transient 429/5xx from Replicate up to 3 times (50ms, 200ms, 800ms).

“Stuck” job: if processing > 10 minutes, flip to failed (UI offers “Try again”). Late success via webhook will still supersede failure and populate renders (idempotent updates).

10) Defaults & presets (source of truth)
Modes order: ['redesign','staging','compose','imagine'] (config).

Room Types & Styles: AU‑oriented lists from config; can be extended without code changes.

Note: advanced generation knobs (aspect ratio, quality, variants) are not used by the current provider and are hidden in the UI.

11) Minimal UI contract (so engine stays simple)
Disable Generate button while a job is in‑flight for the user.

On submit → show inline “Generating…” state (spinner or skeleton).

On success webhook → immediate UI refresh (SWR/RTU via polling GET once or client receives SSE/websocket later—MVP can just refetch on interval).

On TOO_MANY_INFLIGHT → toast: “Please wait until this generation is complete.”

On LIMIT_EXCEEDED → show upgrade CTA.

12) Observability (MVP)
Log the triplet { jobId, predictionId, status } on transitions.

Capture normalized upstream error messages for failed jobs (limit length, no PII).

Metrics (later): counts per mode, median processing time.

13) Files of interest
- libs/services/generation.ts
- libs/services/external/googleNanoBananaAdapter.ts
- libs/services/external/replicateClient.ts
- libs/repositories/{generation_jobs,renders,collections}.ts
- app/api/v1/generations/route.ts (POST)
- app/api/v1/generations/[id]/route.ts (GET, PATCH, DELETE)
- app/api/v1/webhooks/replicate/route.ts (POST; service-role client)
- All routes return normalized JSON and use helpers in libs/api-utils/*

14) Acceptance checklist (engine)
✅ Redesign/Staging/Compose/Imagine produce expected outputs with AU styles.

✅ Single in‑flight rule enforced; clear user feedback.

✅ Webhook flips job to terminal status and persists assets.

✅ Collections: default My Favorites exists; user can add results with one click.

✅ No queue infra; Replicate handles scheduling; our app remains simple.
