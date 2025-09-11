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

