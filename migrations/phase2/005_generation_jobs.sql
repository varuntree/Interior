-- generation_jobs: one record per submission to Replicate
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,                         -- auth.users.id
  mode text not null check (mode in ('redesign','staging','compose','imagine')),
  room_type text,
  style text,
  aspect_ratio text not null default '1:1' check (aspect_ratio in ('1:1','3:2','2:3')),
  quality text not null default 'auto' check (quality in ('auto','low','medium','high')),
  variants int not null default 2 check (variants between 1 and 3),

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