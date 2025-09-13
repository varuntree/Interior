0) Purpose
Authoritative schema + storage spec for MVP. Defines entities, relationships, RLS, indexes, and storage conventions so our APIs and UI are trivial to build against. Follows the repo’s Handbook and Playbooks (files‑only migrations, owner‑scoped RLS, no surprises).

1) Entities & relationships (ER overview)
pgsql
Copy
profiles (existing)
  └─< generation_jobs
         └─1─1 renders
                └─< render_variants
  └─< collections
         └─< collection_items  ──► renders

community_images (public read)
  - flat table of published images (either an internal storage path or an external URL)

usage_ledger (per user debits/credits; read-only to user)
Notes

One render groups a set of render_variants created by a single generation job.

My Favorites is a system collection auto-created per user.

Community is admin-managed; users can only read. Admin uses a temporary allowlist to upload/delete images.

2) Storage (Supabase Storage)
Buckets (already provisioned via 004_storage_buckets.sql):

public — public read, authenticated write.
 
private — owner-only via RLS.

Paths

Inputs (user uploads):
private/${userId}/inputs/<uuid>.<ext>

Outputs (final images visible in product):
public/renders/${renderId}/${variantIndex}.jpg

Community images (admin uploads):
public/community/<uuid>.<ext>

MVP: store originals in public at target size. Thumbnails are optional; if omitted, UI requests the original with CSS‑scaled previews. (We can add server-side thumb generation later without contract changes.)

3) Migrations (files‑only; idempotent)
Migrations are consolidated and idempotent:

3.1 migrations/0001_baseline.sql
sql
Copy
-- Core schema: profiles, generation_jobs, renders, render_variants, collections, collection_items, usage_ledger, logs_analytics, community_images; RLS policies; storage buckets and policies; default favorites trigger.
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,                         -- auth.users.id
  mode text not null check (mode in ('redesign','staging','compose','imagine')),
  room_type text,
  style text,
  -- legacy columns for aspect_ratio/quality/variants have been dropped in later migrations

  -- inputs (we keep references to storage paths, never raw blobs)
  input1_path text,                               -- required for redesign/staging/compose
  input2_path text,                               -- required for compose
  prompt text,                                    -- optional (required for imagine)

  -- replicate tracking
  prediction_id text unique,                      -- replicate prediction id (nullable until created)
  status text not null default 'starting'
    check (status in ('starting','processing','succeeded','failed','canceled')),
  error text,
  idempotency_key uuid,                           -- dedupe per owner
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.generation_jobs enable row level security;

-- RLS: owner can see own jobs
drop policy if exists "jobs_owner_select" on public.generation_jobs;
create policy "jobs_owner_select"
  on public.generation_jobs for select
  using (auth.uid() = owner_id);

-- RLS: owner can insert their own jobs
drop policy if exists "jobs_owner_insert" on public.generation_jobs;
create policy "jobs_owner_insert"
  on public.generation_jobs for insert
  with check (auth.uid() = owner_id);

-- RLS: owner cannot update status directly (webhook/admin does that).
drop policy if exists "jobs_owner_update" on public.generation_jobs;
create policy "jobs_owner_update"
  on public.generation_jobs for update
  using (false); -- only service-role (webhook) should update

-- Indexes
create index if not exists idx_jobs_owner_created_at on public.generation_jobs (owner_id, created_at desc);
create index if not exists idx_jobs_owner_status on public.generation_jobs (owner_id, status);

-- Per-owner idempotency (partial unique to allow nulls)
drop index if exists uniq_jobs_owner_idem;
create unique index uniq_jobs_owner_idem
on public.generation_jobs (owner_id, idempotency_key)
where idempotency_key is not null;
3.2 Renders and Variants (included in 0001_baseline.sql)
sql
Copy
-- renders: one per job (grouping of variants)
create table if not exists public.renders (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.generation_jobs(id) on delete cascade,
  owner_id uuid not null,
  mode text not null,
  room_type text,
  style text,
  cover_variant int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.renders enable row level security;

-- RLS
drop policy if exists "renders_owner_select" on public.renders;
create policy "renders_owner_select"
  on public.renders for select
  using (auth.uid() = owner_id);

drop policy if exists "renders_owner_insert" on public.renders;
create policy "renders_owner_insert"
  on public.renders for insert
  with check (auth.uid() = owner_id);

drop policy if exists "renders_owner_delete" on public.renders;
create policy "renders_owner_delete"
  on public.renders for delete
  using (auth.uid() = owner_id);

-- Variants
create table if not exists public.render_variants (
  id uuid primary key default gen_random_uuid(),
  render_id uuid not null references public.renders(id) on delete cascade,
  owner_id uuid not null,
  idx int not null,                     -- 0..N-1
  image_path text not null,             -- storage relative path (public bucket)
  thumb_path text,                      -- optional
  created_at timestamptz not null default now()
);

alter table public.render_variants enable row level security;

drop policy if exists "variants_owner_select" on public.render_variants;
create policy "variants_owner_select"
  on public.render_variants for select
  using (auth.uid() = owner_id);

drop policy if exists "variants_owner_insert" on public.render_variants;
create policy "variants_owner_insert"
  on public.render_variants for insert
  with check (auth.uid() = owner_id);

drop policy if exists "variants_owner_delete" on public.render_variants;
create policy "variants_owner_delete"
  on public.render_variants for delete
  using (auth.uid() = owner_id);

-- Indexes
create index if not exists idx_renders_owner_created on public.renders (owner_id, created_at desc);
create index if not exists idx_variants_render_idx on public.render_variants (render_id, idx);
3.3 Collections & Items (included in 0001_baseline.sql)
sql
Copy
-- collections: user-defined groups; includes default "My Favorites"
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  is_default_favorites boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.collections enable row level security;

-- RLS
drop policy if exists "collections_owner_select" on public.collections;
create policy "collections_owner_select"
  on public.collections for select
  using (auth.uid() = owner_id);

drop policy if exists "collections_owner_insert" on public.collections;
create policy "collections_owner_insert"
  on public.collections for insert
  with check (auth.uid() = owner_id);

drop policy if exists "collections_owner_update" on public.collections;
create policy "collections_owner_update"
  on public.collections for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "collections_owner_delete" on public.collections;
create policy "collections_owner_delete"
  on public.collections for delete
  using (auth.uid() = owner_id and is_default_favorites = false);

-- Unique default favorites per owner
create unique index if not exists uniq_owner_default_fav
on public.collections(owner_id)
where is_default_favorites = true;

-- Items (many-to-many to renders)
create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  render_id uuid not null references public.renders(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, render_id)
);
alter table public.collection_items enable row level security;

-- RLS: owner of the collection controls items
drop policy if exists "coll_items_owner_select" on public.collection_items;
create policy "coll_items_owner_select"
  on public.collection_items for select
  using (
    exists(select 1 from public.collections c
           where c.id = collection_id and c.owner_id = auth.uid())
  );

drop policy if exists "coll_items_owner_insert" on public.collection_items;
create policy "coll_items_owner_insert"
  on public.collection_items for insert
  with check (
    exists(select 1 from public.collections c
           where c.id = collection_id and c.owner_id = auth.uid())
  );

drop policy if exists "coll_items_owner_delete" on public.collection_items;
create policy "coll_items_owner_delete"
  on public.collection_items for delete
  using (
    exists(select 1 from public.collections c
           where c.id = collection_id and c.owner_id = auth.uid())
  );

-- Index
create index if not exists idx_coll_items_coll on public.collection_items (collection_id);
3.4 Community images (included in 0001_baseline.sql)
sql
Copy
-- Flat public gallery with allowlist-based admin writes
create table if not exists public.community_images (
  id uuid primary key default gen_random_uuid(),
  image_path text,
  thumb_path text,
  external_url text,
  title text,
  tags text[],
  apply_settings jsonb,
  is_published boolean not null default true,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  constraint community_image_src check ((image_path is not null) <> (external_url is not null))
);

alter table public.community_images enable row level security;

drop policy if exists "comm_images_public_read" on public.community_images;
create policy "comm_images_public_read" on public.community_images for select
  using (is_published = true);

-- Admin writes are performed from server-only endpoints using service role; no RLS policy for public writes.

create index if not exists idx_comm_images_pub_order
  on public.community_images (is_published, order_index asc, created_at desc);
create index if not exists idx_comm_images_tags_gin
  on public.community_images using gin (tags);
3.5 Usage ledger (included in 0001_baseline.sql)
sql
Copy
-- usage_ledger: track generation debits/credits
create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  kind text not null check (kind in ('generation_debit','credit_adjustment')),
  amount int not null,                -- positive integers
  meta jsonb,                         -- { jobId, reason, ... }
  created_at timestamptz not null default now()
);
alter table public.usage_ledger enable row level security;

-- RLS: owner can read their own
drop policy if exists "usage_owner_select" on public.usage_ledger;
create policy "usage_owner_select"
  on public.usage_ledger for select
  using (auth.uid() = owner_id);

-- Writes: from API/service only; users do not write directly
drop policy if exists "usage_owner_insert" on public.usage_ledger;
create policy "usage_owner_insert"
  on public.usage_ledger for insert
  with check (auth.uid() = owner_id);

create index if not exists idx_usage_owner_created on public.usage_ledger (owner_id, created_at desc);
3.6 Default favorites trigger (included in 0001_baseline.sql)
4) Repositories (shape & contracts)
Implement in libs/repositories/*.ts. Pure functions, accept SupabaseClient, return typed rows.

4.1 generation_jobs.ts
createJob(supabase, row: NewJob) -> Job

getJobById(supabase, id) -> Job | null

findInflightJobForUser(supabase, ownerId) -> Job | null (status in starting|processing)

setJobStatus(supabase, id, patch: { status, error?, prediction_id?, completed_at? })

attachPrediction(supabase, id, predictionId)

4.2 renders.ts
createRender(supabase, row) -> Render

addVariant(supabase, row) -> RenderVariant

listRenders(supabase, ownerId, filters, pagination) -> { items, nextCursor }

getRender(supabase, id, ownerId) -> Render & variants

4.3 collections.ts
listCollections(supabase, ownerId)

getDefaultFavorites(supabase, ownerId) -> Collection

createCollection(supabase, ownerId, name)

renameCollection(supabase, id, ownerId, name)

deleteCollection(supabase, id, ownerId)

addToCollection(supabase, collectionId, renderId)

removeFromCollection(supabase, collectionId, renderId)

listCollectionItems(supabase, collectionId)

4.4 community.ts
listCommunity(supabase) — public read across collections+items

4.5 usage.ts
debitGeneration(supabase, ownerId, jobId, amount=1)

getMonthlyUsage(supabase, ownerId, fromDateUtc) -> number

5) Derived values & limits
Remaining generations

Determine plan from profiles.price_id → map to config plan (server‑side).

remaining = plan.monthlyGenerations - sum(usage_ledger.amount where kind='generation_debit' and created_at in current UTC calendar month)

Enforced in service at submit time.

Inflight rule

exists generation_jobs where owner_id = ? and status in ('starting','processing') → block new submit with 409.

Stuck protection

UI shows progress. Service may poll Replicate once on GET if job is stale. A job older than 10 minutes without terminal status is flipped to failed (still idempotent to accept a late webhook that succeeds).

6) Data retention
Jobs & renders retained indefinitely (for MVP).

Users can delete renders; cascade removes variants (job rows remain for audit).

Community content is curated; removal detaches only links (renders remain).

7) Config touchpoints
config.ts: plans metadata, presets (room types, styles), default collection name "My Favorites".

Ensure types/config.ts requirement is met: set colors.theme (e.g., 'light') in config.ts.

8) Operational checks (schema)
Apply migrations in order; verify RLS policies exist.

Confirm public & private buckets are present (created in 0001_baseline.sql).

Run a manual flow: create job → webhook success → renders & variants exist; paths point to public bucket; collection default exists.
