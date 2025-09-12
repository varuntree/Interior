0) Purpose
This document specifies how the app is wired (topology, auth, storage, config) and defines the API contracts (including the Replicate webhook). It aligns to the repo’s handbook & playbooks and keeps the MVP code simple and incremental.

1) Topology & layering
bash
Copy
UI (Next.js App Router, Tailwind, shadcn)
   ↓ fetch
/app/api/v1/** (route handlers = validate + orchestrate, no business logic)
/libs/services/** (business logic: compose repos + external SDKs)
/libs/repositories/** (Supabase DB access, pure functions)
/migrations/** (SQL + RLS)
/libs/storage/** (uploads + signed URLs)
/libs/supabase/** (client wrappers for SSR/middleware)
External: Replicate (Google nano-banana), Stripe, Supabase Storage
Private pages: (app)/dashboard/* guarded in app/(app)/dashboard/layout.tsx by calling /api/v1/auth/me; unauth → redirect to /signin.

No Server Actions. No direct DB from components.

Admin (service role): webhooks only.

2) Auth & roles
Auth: Supabase (SSR client in layouts, browser client for auth UI only)

Roles:

user: can create jobs, manage renders & collections

admin: manage community collections + read webhooks (Stripe/Replicate)

Middleware: middleware.ts refreshes session cookies via libs/supabase/middleware

3) Config (central)
File: config.ts (non‑secret)

product.modesOrder, product.presets.roomTypes, product.presets.styles

product.generation.defaults (mode only; simplified)

product.generation.limits.maxVariantsUI, allowedAspectRatios

product.collections.defaultCollectionName = "My Favorites"

plans[] with { id, priceAudPerMonth, monthlyGenerations, stripePriceId? }

Secrets: .env only (Stripe keys, Supabase keys, webhook secrets)

Note: types/config.ts expects colors.theme; set theme: 'light' alongside main.

4) Data (overview)
Detailed DDL lives in Data & Storage spec. Entities we depend on here:

profiles (pre‑existing)

generation_jobs (job tracking + Replicate prediction id)

renders, render_variants

collections, collection_items (default “My Favorites”)

community_images

usage_ledger

RLS: owner‑read/write on user‑owned tables, public read on community tables; storage policies already provided for public/private buckets.

Storage paths (convention):

inputs → private/${userId}/inputs/<uuid>.<ext>

outputs → public/renders/${renderId}/${variantIndex}.jpg (legacy .webp for historical renders)

thumbs → public/renders/${renderId}/${variantIndex}_thumb.webp

5) Error & response standard
All endpoints return normalized JSON:

ts
Copy
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  message?: string;
}
Common error.code:

VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN

NOT_FOUND, TOO_MANY_INFLIGHT, LIMIT_EXCEEDED

UPSTREAM_ERROR, INTERNAL_ERROR

Default headers: Cache-Control: private, no-store.

6) API surface (v1)
Paths live under app/api/v1/**. Route handlers use the repo’s helpers in libs/api-utils/* (validation, responses) and call services in libs/services/**. No repositories called directly from routes.

6.1 Auth
GET /api/v1/auth/me
Auth: required

Response 200:

json
Copy
{ "success": true, "data": { "id": "uuid", "email": "user@example.com" } }
Errors: 401 UNAUTHORIZED

6.2 Generation (Phase 0: simple async via Replicate)
POST /api/v1/generations
Create a generation job and immediately ask Replicate to start. Webhook will finalize.

Auth: required

Content-Type: multipart/form-data or application/json

If multipart/form-data, fields:

mode: redesign | staging | compose | imagine (required)

prompt: string (required for imagine; optional otherwise)

roomType: string (optional)

style: string (optional)

aspectRatio: "1:1" | "3:2" | "2:3" (optional; default from config)

quality: "auto" | "low" | "medium" | "high" (optional; default auto)

variants: integer 1–3 (optional; default 2)

idempotencyKey: string UUID (optional but recommended)

input1: file (required for redesign/staging/compose)

input2: file (required for compose)

If application/json, the same fields but input1Url/input2Url must be provided (signed URLs). Server will not accept raw base64 in JSON.

Server behavior:

Credits check (plans in config; if 0 → LIMIT_EXCEEDED)

In‑flight check: if user already has a job in starting|processing, return 409 TOO_MANY_INFLIGHT

If files provided, upload to Supabase Storage (private) and generate short‑lived signed URLs for Replicate

Build prompt template per mode (see §8)

Create Replicate prediction with webhook URL to /api/v1/webhooks/replicate

Persist generation_jobs row with status: "starting" (or "queued" if returned), store prediction_id

Debit one generation from usage_ledger (idempotent on idempotencyKey)

Return job summary

Response 202:

json
Copy
{
  "success": true,
  "data": {
    "id": "job_uuid",
    "status": "starting",
    "mode": "redesign",
    "settings": {
      "roomType": "Living room",
      "style": "Coastal AU"
    },
    "predictionId": "replicate_pred_123"
  }
}
Errors:

400 VALIDATION_ERROR (missing files per mode)

401 UNAUTHORIZED

402 LIMIT_EXCEEDED (no credits)

409 TOO_MANY_INFLIGHT

502 UPSTREAM_ERROR (Replicate create failed)

GET /api/v1/generations/:id
Auth: required (owner only)

Behavior:

Fetch job from DB; if non‑terminal and stale (>5s), poll Replicate once to refresh status; update DB.

Response 200:

json
Copy
{
  "success": true,
  "data": {
    "id": "job_uuid",
    "status": "processing",
    "createdAt": "2025-08-09T10:02:13.000Z",
    "mode": "redesign",
    "variants": [
      // present only when status = succeeded
      { "index": 0, "url": "https://cdn/render/abc0.jpg", "thumbUrl": "..." }
    ],
    "error": null
  }
}
Errors: 404 NOT_FOUND, 403 FORBIDDEN

6.3 Renders
GET /api/v1/renders?cursor=&limit=&mode=&roomType=&style=
Auth: required

Response 200:

json
Copy
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "render_uuid",
        "coverVariantUrl": "https://cdn/render/r1/0.jpg",
        "createdAt": "2025-08-09T10:10:00Z",
        "mode": "redesign",
        "roomType": "Living room",
        "style": "Coastal AU"
      }
    ],
    "nextCursor": "opaque_cursor_or_null"
  }
}
GET /api/v1/renders/:id
Auth: required (owner)

Returns render metadata + variant URLs.

DELETE /api/v1/renders/:id
Auth: required (owner)

Deletes DB record; leaves assets (optional soft‑delete policy can be added later)

6.4 Collections
GET /api/v1/collections
Auth: required; returns all user collections (with flag for default My Favorites)

POST /api/v1/collections
Body: { "name": "Project Alpha" }

Creates user collection

PATCH /api/v1/collections/:id
Body: { "name": "New Name" } (cannot rename default favorites to empty)

DELETE /api/v1/collections/:id
Deletes collection if not default favorites and empty (or cascade if you prefer)

POST /api/v1/collections/:id/items
Body: { "renderId": "render_uuid" } → adds to collection (idempotent)

DELETE /api/v1/collections/:id/items/:renderId
Removes from collection

6.5 Community
Public feed (images)
- GET /api/v1/community — returns public gallery (synthesized collection of published images)
- GET /api/v1/community/collections — returns one synthesized collection (Inspiration)
- GET /api/v1/community/collections/community/items — returns published images (id, image_url, tags?, title?)

Admin (temporary, allowlist-based)
- POST /api/v1/admin/community/images/upload (multipart/form-data: files[])
  - Auth required; email must be in ADMIN_EMAILS.
  - Uploads to public bucket and inserts rows in community_images.
- POST /api/v1/admin/community/images/delete (JSON: { ids: string[] })
  - Auth required; email must be in ADMIN_EMAILS.
  - Deletes storage objects and DB rows for selected images.

6.6 Usage & plans
GET /api/v1/usage
Auth: required

Returns: { remainingGenerations: number, planId: string }

6.7 Stripe (existing bridges)
Keep legacy routes working:

/api/stripe/create-checkout → re‑export v1

/api/stripe/create-portal → re‑export v1

v1 endpoints (unchanged contract):

POST /api/v1/stripe/create-checkout

POST /api/v1/stripe/create-portal

Stripe webhook remains under /api/v1/webhooks/stripe (already bridged at /api/webhook/stripe)

7) Webhooks
7.1 Replicate
POST /api/v1/webhooks/replicate
Auth: HMAC verification with a shared secret (env). Reject if invalid.

Payload (shape varies slightly by model; store minimally required fields):

json
Copy
{
  "id": "replicate_pred_123",
  "status": "succeeded",
  "output": ["https://.../out0.png", "https://.../out1.png"],
  "error": null,
  "logs": "..."
}
Behavior:

Look up generation_jobs by prediction_id

If succeeded:

Download each output asset and write to Supabase Storage /public

Generate thumbnails (server‑side transform or store as returned if already webp)

Create renders + render_variants linked to job, set cover variant

Set job status = "succeeded", completed_at = now()

If failed:

Set status = "failed", store normalized error message

Return 200 { success: true }

Idempotency: webhook handler must be safe to repeat.

7.2 Stripe idempotency (event store)
Stripe delivers events at-least-once. The app persists a record per event in `public.webhook_events` with a unique `(provider, event_id)` constraint. The webhook handler inserts the event before processing and early-exits on duplicates. This guarantees replay-safety across retries or multiple instances.

7.2 Stripe
Existing webhook continues to manage plan state (customer ids, plan mapping). No changes needed here.

7.3 Admin endpoints (temporary exception)
Admin endpoints under /api/v1/admin/** are server-only, allowlist-gated via ADMIN_EMAILS, and may use the service-role client to write to DB/storage. Keys are never exposed to clients. Remove these endpoints when an alternative admin workflow is established.

8) Replicate integration (brief guide)
Model: google/nano-banana on Replicate

Create prediction:

Inputs we send:

prompt (composed: base + mode template + user prompt)

image[] (signed URLs for input1/input2 where relevant)

image_input, output_format='jpg' (default)

Webhook: send webhook URL to /api/v1/webhooks/replicate

Idempotency: include idempotency_key if supported, or enforce on our side with idempotencyKey

Statuses: starting → processing → succeeded | failed | canceled

Timeouts & retries:

Client submit path retries transient 429/5xx up to 3 times with exponential backoff

Job “stuck” cutoff at 10 minutes; mark failed but still accept late webhook to flip to success if it arrives (idempotent)

Output: always persist outputs to our own storage; never rely long‑term on external URLs

9) Services (where logic lives)
libs/services/generation.ts

submitGeneration(ctx, args):

Enforce credits + in‑flight rules

Handle uploads → signed URLs

Compose prompt template per mode

Create prediction (Replicate) with webhook

Persist job; debit ledger; return summary

getGeneration(ctx, id):

Fetch job; if stale non‑terminal, poll Replicate once and upsert status

libs/services/renders.ts

libs/services/collections.ts

libs/services/community.ts

libs/services/usage.ts

Routes invoke only services; services call repositories; repositories use the Supabase client passed by the caller.

10) Validation & helpers
Use existing utilities in libs/api-utils/*:

validate.ts (zod parsing helpers)

responses.ts (ok, fail)

errors.ts (normalize known errors)

All routes enforce methods explicitly (e.g., switch on req.method or a small withMethods helper if present)

11) Security notes
Service‑role keys only in webhooks

All user‑owned tables protected by RLS

Uploads:

Inputs go to private bucket; outputs/ thumbs go to public (or private + signed URL if you prefer)

Webhook secrets in env; verify per request

12) Performance notes
Thumb generation should be O(#variants); prefer server‑side resize once

List endpoints page at limit = 24 by default; use cursor pagination

Cache headers: no-store on API; leverage CDN for public images

13) Example contracts (concise)
POST /api/v1/generations (multipart)
Request (fields):

ini
Copy
mode=redesign
prompt=airy, light timber accents
roomType=Living room
style=Coastal AU
aspectRatio=1:1
quality=auto
variants=2
idempotencyKey=2d8c7f3d-51f5-4e15-8e32-b8d0f7ac2af0
input1=<file>
Success 202:

json
Copy
{
  "success": true,
  "data": {
    "id": "3b7d8c4a-...-1d2",
    "status": "starting",
    "predictionId": "rpctn_abc123",
    "settings": {
      "roomType": "Living room",
      "style": "Coastal AU",
      "aspectRatio": "1:1",
      "quality": "auto",
      "variants": 2
    }
  }
}
Error 409:

json
Copy
{
  "success": false,
  "error": { "code": "TOO_MANY_INFLIGHT", "message": "Please wait until this generation is complete." }
}
Webhook payload (succeeded) → what we store
json
Copy
{
  "id": "rpctn_abc123",
  "status": "succeeded",
  "output": ["https://replicate/...0.png", "https://replicate/...1.png"]
}
Server downloads → public/renders/<renderId>/0.webp, 1.webp; writes renders & render_variants.

14) Minimal operational checklist
npm run build passes

Grep checks (from handbook) all 0

Create → Succeed round‑trip validated (manual): submit → spinner → webhook flips UI → results visible in My Renders, "Add to My Favorites" works

Failure path validated: force a Replicate error → job marked failed → user can re‑submit

15) Rendering/UI infrastructure

**Design System Integration:**
- Theme v2 tokens live in `app/globals.css` under `:root` and `.dark` selectors
- Tailwind reads design tokens via `tailwind.config.js` mapped to `hsl(var(--...))`
- No API changes required for theme updates
- Components automatically inherit theme variables through Tailwind utilities

**Key Theme Variables:**
- Primary color: `--primary` (blue tone for modern look)
- Border radius: `--radius: 1.3rem` (rounded, modern aesthetic)
- Typography: `--font-sans: Open Sans` (improved readability)
- Shadows: Minimal/flat design with 0.00 opacity for clean look

**Responsive Breakpoints:**
- Mobile: <768px (single column, sticky CTAs)
- Tablet: 768px-1279px (two column layouts)
- Desktop: ≥1280px (three column layouts, full features)

Appendix A — Mode prompt scaffolds (high level)
(Exact text lives in the Generation Engine spec; shown here so API/service shape makes sense.)

Redesign: keep layout, walls, windows, flooring; change furnishings & palette → {style} for {roomType} in AU homes; natural light; realistic perspective.

Staging: assume room may be empty; stage tasteful furniture set for {style}; avoid structural edits.

Compose: apply palette/object characteristics of input2 to input1; keep input1 structure; harmonize lighting.

Imagine: generate interior scene for {roomType} in {style}; photoreal; balanced composition.
