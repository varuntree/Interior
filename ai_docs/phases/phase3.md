PHASE_03__inputs-and-presets.md
1) Title & Goal
Inputs & Presets: add image‑to‑image, room/style presets, aspect ratios, and up to 2 variants (configurable), while keeping the submit/poll flow unchanged.

2) Scope (In/Out)
In

Extend existing POST /api/v1/generations/submit to accept:

image (optional base image) and ref_image (optional reference) via multipart/form-data or pre‑uploaded URLs.

aspectRatio (from a small allowed list).

variantCount ∈ {1, 2} (default 1; max 2, centrally configurable).

roomType, style (preset names mapped to prompt fragments).

Add a tiny presets/config module (central place) and storage helper for uploads.

Extend generations row to capture inputs & multiple URLs.

Out

No collections/favorites (Phase 4).

No credits enforcement (Phase 5).

No webhooks or queues.

3) Spec References
specs/01-prd.md — Core flows (Virtual Staging, Interior Redesign, Imagine).

specs/02-system-architecture-and-api.md — API normalization, boundaries.

specs/04-ui-ux.md — Generate UI (sidebar nav, prompt + upload + presets).

docs/02-playbooks-and-templates.md — File upload + API templates.

4) Planned Changes (by layer)
API routes
Modify app/api/v1/generations/submit/route.ts

Accept either JSON or multipart/form-data.

Schema (conceptual):

ts
Copy
{
  prompt: string,                // required (non-empty)
  image?: File | string,         // optional (file in form-data or https URL)
  ref_image?: File | string,     // optional
  aspectRatio?: '1:1' | '3:2' | '4:3' | '16:9',
  variantCount?: 1 | 2,
  roomType?: string,             // from presets
  style?: string                 // from presets
}
Steps (after Phase 2 logic):

Parse body; if multipart, read formData.

Validate against allowed sets from presets module.

If file(s) provided, upload via storage helper to private bucket and produce signed, short‑lived URLs for Replicate.

Build prompt composite: basePrompt = userPrompt + preset(roomType, style); append aspect ratio & guidance tokens.

Call submitGeneration() with { baseImageUrl?, refImageUrl?, aspectRatio?, variantCount?, prompt }.

Return { id }.

No change to GET /api/v1/generations/:id contract; but it can now return result_urls: string[] on success (in addition to the legacy url for compatibility).

Services
Update libs/services/replicate.ts

startPrediction(args: { prompt; baseImageUrl?; refImageUrl?; aspectRatio?; variantCount?: 1|2 })

Map to Replicate gpt-image-1 input shape:

prompt = composed

image[] = include provided URLs (base, ref) as needed

size/aspect_ratio = mapped value

num_outputs = 1 or 2 (bounded by config)

fetchPrediction(externalId) must parse an array of output URLs; keep compatibility by also exposing the first as url.

Update libs/services/generations.ts

Persist inputs (JSON), result_urls (text[]).

When finalizing, set status='succeeded', result_urls (array).

Maintain backward compatibility: return { url: result_urls[0] } and { result_urls }.

Add libs/constants/presets.ts

export const ASPECT_RATIOS = ['1:1','3:2','4:3','16:9'] as const

export const VARIANTS_MAX = 2

export const ROOM_TYPES = [...]

export const STYLES = [...]

export function composePrompt(userPrompt, {roomType, style}) { /* returns string */ }

Keep contents small and editable; these are the centrally configurable lists/templates.

Add libs/storage/generations.ts

uploadInputImage(supabase, { userId, file }): Promise<{ path, publicUrlOrSignedUrl }>

getSignedUrl(...) helper with short expiry (e.g., 120s) for Replicate.

Repositories / DB
Add migration migrations/phase3/006_alter_generations_inputs.sql

sql
Copy
alter table public.generations
  add column if not exists input_image_url text,
  add column if not exists reference_image_url text,
  add column if not exists inputs jsonb,
  add column if not exists result_urls text[];

-- Optional sanity indexes
create index if not exists idx_generations_owner_created_at
  on public.generations (owner_id, created_at desc);
RLS already enforced from Phase 2.

Update libs/repositories/generations.ts

Extend create/updateStatusAndUrl to also set inputs, input_image_url, reference_image_url, and result_urls.

UI
Add app/(app)/dashboard/generate/page.tsx (extend from Phase 2 skeleton):

Controls:

Prompt textarea

Upload: base image (optional)

Upload: reference image (optional)

Dropdown: Room Type (from presets)

Dropdown: Style (from presets)

Segmented: Aspect ratio

Toggle: 1 or 2 variants (respect VARIANTS_MAX)

Keep single in‑flight guard and same loading/result experience.

Show both variant thumbnails when 2 outputs.

Config
No edits to config.ts (guardrail). All options live in libs/constants/presets.ts.

5) Replicate usage (this phase)
Inputs may include one or two images; pass URLs.

num_outputs ≤ 2; adhere to ASPECT_RATIOS mapping approved.

Keep timeout conservative; do not introduce webhook yet.

6) Constraints & Guardrails
No Server Actions; no DB from components.

File uploads go to private bucket; we only share signed URLs to Replicate.

Validate preset names strictly; reject unknown values with 400 + details.

7) Acceptance Criteria
Submit with prompt‑only → works (unchanged).

Submit with base image and aspect ratio → produces image(s).

Submit with variantCount=2 → returns two URLs; UI shows both.

Unknown style/room or aspect ratio → 400 VALIDATION_ERROR.

In‑flight guard (Phase 2) still works.

Generator page mobile layout works with sticky action button and no overflow on small screens (<768px).

Build + greps green.

8) Artifacts
ai_docs/changes/PHASE_03__change_spec.md

ai_docs/reports/PHASE_03__qa-report.md

