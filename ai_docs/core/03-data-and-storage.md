# Data & Storage — Interior Design Generator (Core)

Purpose
- Define the data model, RLS intent, indexes, and storage conventions so routes/services remain simple and predictable. This is the single reference for entities, relationships, and how assets are laid out in Supabase Storage.

Entity Model (ER Overview)
- Users have Profiles (id == auth.users.id). A Generation Job is created per submit and results in exactly one Render grouping one or more Render Variants; users organize Renders into Collections via Collection Items; Community images are admin-curated and public-read; Usage Ledger records debits/credits that power plan caps. Core tables: profiles, generation_jobs, renders, render_variants, collections, collection_items, community_images, usage_ledger (plus optional analytics tables added later).

Table Summaries & RLS (Intent)
- profiles: basic account and billing linkage (email, price_id, customer_id). RLS: self select/update (owner id == auth.uid()).
- generation_jobs: owner_id, mode, room_type, style, input paths, prompt, prediction_id, status, error, idempotency_key, timestamps. RLS: owner can select/insert; owner cannot update (status is webhook/admin only). Indexes: (owner_id, created_at desc), (owner_id, status), unique (owner_id, idempotency_key) where key not null.
- renders: one per job; copies mode/room/style; cover_variant; created_at. RLS: owner select/insert/delete. Index: (owner_id, created_at desc).
- render_variants: render_id, owner_id, idx (0..N‑1), image_path, thumb_path?, created_at. RLS: owner select/insert/delete. Index: (render_id, idx).
- collections: owner_id, name, is_default_favorites. RLS: owner select/insert/update/delete (delete disallowed for default favorites). Unique partial index: one default favorites per owner.
- collection_items: (collection_id, render_id) PK, added_at. RLS: owner of the collection controls select/insert/delete via EXISTS policy.
- community_images: image_path or external_url (XOR), title?, tags?, apply_settings?, is_published, order_index, created_at. RLS: public select (is_published=true); admin writes via server-only endpoints.
- usage_ledger: owner_id, kind ('generation_debit'|'credit_adjustment'), amount, meta, created_at. RLS: owner select/insert (inserts performed by API); Index: (owner_id, created_at desc).

Storage Model (Buckets, Paths, URLs)
- Buckets: `public` (public read, authenticated write) and `private` (RLS‑scoped to owner). Inputs upload to `private/${userId}/inputs/<uuid>.<ext>` and never leave the private bucket; short‑lived signed URLs (≈300s) are created server‑side for Replicate. Outputs upload to `public/renders/${renderId}/${variantIndex}.webp` (optionally `.../${variantIndex}_thumb.webp` later); client displays via public URLs from Supabase Storage. Never expose service‑role keys in UI; all signing happens in server context.

Lifecycle (From Submit to Results)
- Submit creates a `generation_jobs` row in status `starting` and debits `usage_ledger` (idempotent on job/idempotencyKey). On webhook success, the server creates a `renders` row, stores each output image to `public` under the render folder, inserts `render_variants` (idx ascending), and flips the job to `succeeded`. On failure, the job is marked `failed` with a normalized error and no render rows are created. Deleting a render removes DB rows; asset deletion from storage is optional in MVP (a cleanup helper exists but is not wired to deletes by default).

Pagination & Filtering (User Lists)
- Listing renders uses created_at descending with a simple cursor (created_at of last item) and an over‑fetch of `limit+1` to detect `nextCursor`. Common filters: mode, room_type, style. Collections and items list by owner or collection id; community lists order by `is_featured, order_index, created_at`.

Idempotency & Integrity
- Jobs: per‑owner partial unique index on (owner_id, idempotency_key) prevents duplicate accepts on retries; repositories offer `findJobByIdempotencyKey`. Usage debits include the jobId and idempotencyKey in `meta` so the service can no‑op on repeated submits. Community items enforce XOR between `render_id` and `external_image_url` via a table constraint.

Performance Notes (Indexes & Size)
- Hot paths are indexed: jobs by owner/time and status; renders by owner/time; variants by render/idx; usage by owner/time; community by featured/order. Inputs are capped by accepted MIME types and max upload size (see runtime config), and outputs are `.jpg` for efficient delivery. Avoid large response payloads; fetch variants on demand.

Security & RLS Summary
- All user‑owned tables use owner‑scoped RLS for select/insert (updates/deletes as appropriate). Job status updates are blocked to users and performed only by webhook/admin. Community tables allow public read only; admin writes are enforced in server code using the service‑role client. Private inputs never become public; only derived outputs are public. Ensure env‑validated keys are used exclusively on server.
