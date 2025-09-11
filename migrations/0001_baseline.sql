-- Baseline schema for Interior Design Generator
-- Idempotent. Reflects the current live database shape.

-- =============================
-- 1) Core Tables
-- =============================

-- profiles
create table if not exists public.profiles (
  id uuid primary key,
  email text unique,
  customer_id text,
  price_id text,
  has_access boolean not null default false,
  created_at timestamptz default now(),
  name text,
  preferences jsonb default '{}'::jsonb
);
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- admins (self-managed list; used to gate admin writes for public content)
create table if not exists public.admins (
  owner_id uuid primary key,
  email text unique,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;

drop policy if exists "admins_owner_select" on public.admins;
create policy "admins_owner_select" on public.admins for select
  using (auth.uid() = owner_id);

drop policy if exists "admins_owner_insert" on public.admins;
create policy "admins_owner_insert" on public.admins for insert
  with check (auth.uid() = owner_id);

drop policy if exists "admins_owner_delete" on public.admins;
create policy "admins_owner_delete" on public.admins for delete
  using (auth.uid() = owner_id);

-- generation_jobs
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  mode text not null check (mode in ('redesign','staging','compose','imagine')),
  room_type text,
  style text,
  input1_path text,
  input2_path text,
  prompt text,
  prediction_id text unique,
  status text not null default 'starting' check (status in ('starting','processing','succeeded','failed','canceled')),
  error text,
  idempotency_key uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.generation_jobs enable row level security;

drop policy if exists "jobs_owner_select" on public.generation_jobs;
create policy "jobs_owner_select"
  on public.generation_jobs for select
  using (auth.uid() = owner_id);

drop policy if exists "jobs_owner_insert" on public.generation_jobs;
create policy "jobs_owner_insert"
  on public.generation_jobs for insert
  with check (auth.uid() = owner_id);

drop policy if exists "jobs_owner_update" on public.generation_jobs;
create policy "jobs_owner_update"
  on public.generation_jobs for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists idx_jobs_owner_created_at on public.generation_jobs (owner_id, created_at desc);
create index if not exists idx_jobs_owner_status on public.generation_jobs (owner_id, status);
drop index if exists uniq_jobs_owner_idem;
create unique index uniq_jobs_owner_idem on public.generation_jobs (owner_id, idempotency_key) where idempotency_key is not null;

-- renders
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

create index if not exists idx_renders_owner_created on public.renders (owner_id, created_at desc);

-- render_variants
create table if not exists public.render_variants (
  id uuid primary key default gen_random_uuid(),
  render_id uuid not null references public.renders(id) on delete cascade,
  owner_id uuid not null,
  idx int not null,
  image_path text not null,
  thumb_path text,
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

create index if not exists idx_variants_render_idx on public.render_variants (render_id, idx);

-- collections (with default favorites)
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  is_default_favorites boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.collections enable row level security;

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

create unique index if not exists uniq_owner_default_fav on public.collections(owner_id) where is_default_favorites = true;

-- collection_items referencing renders
create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  render_id uuid not null references public.renders(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, render_id)
);
alter table public.collection_items enable row level security;

drop policy if exists "coll_items_owner_select" on public.collection_items;
create policy "coll_items_owner_select"
  on public.collection_items for select
  using (exists(select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid()));

drop policy if exists "coll_items_owner_insert" on public.collection_items;
create policy "coll_items_owner_insert"
  on public.collection_items for insert
  with check (exists(select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid()));

drop policy if exists "coll_items_owner_delete" on public.collection_items;
create policy "coll_items_owner_delete"
  on public.collection_items for delete
  using (exists(select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid()));

create index if not exists idx_coll_items_coll on public.collection_items (collection_id);

-- usage_ledger
create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  kind text not null check (kind in ('generation_debit','credit_adjustment')),
  amount int not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
alter table public.usage_ledger enable row level security;

drop policy if exists "usage_owner_select" on public.usage_ledger;
create policy "usage_owner_select"
  on public.usage_ledger for select
  using (auth.uid() = owner_id);

drop policy if exists "usage_owner_insert" on public.usage_ledger;
create policy "usage_owner_insert"
  on public.usage_ledger for insert
  with check (auth.uid() = owner_id);

create index if not exists idx_usage_owner_created on public.usage_ledger (owner_id, created_at desc);

-- logs_analytics
create table if not exists public.logs_analytics (
  id bigint generated by default as identity primary key,
  owner_id uuid,
  type text not null,
  payload jsonb,
  created_at timestamptz default now()
);
alter table public.logs_analytics enable row level security;

drop policy if exists "analytics_insert" on public.logs_analytics;
create policy "analytics_insert" on public.logs_analytics for insert
  with check (auth.uid() = owner_id or owner_id is null);

drop policy if exists "analytics_no_select" on public.logs_analytics;
create policy "analytics_no_select" on public.logs_analytics for select
  using (false);

-- community_images (flat public gallery)
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

drop policy if exists "comm_images_admin_all" on public.community_images;
create policy "comm_images_admin_all" on public.community_images
  for all using (exists (select 1 from public.admins a where a.owner_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.owner_id = auth.uid()));

create index if not exists idx_comm_images_pub_order on public.community_images (is_published, order_index asc, created_at desc);
create index if not exists idx_comm_images_tags_gin on public.community_images using gin (tags);
create index if not exists idx_comm_images_apply_settings on public.community_images using gin (apply_settings jsonb_path_ops);

-- =============================
-- 2) Triggers & Functions
-- =============================

-- Create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Create default favorites collection on profile creation
create or replace function public.create_default_favorites()
returns trigger as $$
begin
  insert into public.collections (owner_id, name, is_default_favorites)
  values (new.id, 'My Favorites', true)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_create_fav on public.profiles;
create trigger on_profile_created_create_fav
after insert on public.profiles
for each row execute function public.create_default_favorites();

-- =============================
-- 3) Storage Buckets & Policies
-- =============================

-- Buckets
insert into storage.buckets (id, name, public) values ('public', 'public', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('private', 'private', false)
on conflict (id) do nothing;

-- RLS policies on storage.objects
drop policy if exists "Public read" on storage.objects;
create policy "Public read"
  on storage.objects for select
  using (bucket_id = 'public');

drop policy if exists "Authenticated write public" on storage.objects;
create policy "Authenticated write public"
  on storage.objects for insert
  with check (bucket_id = 'public' and auth.role() = 'authenticated');

drop policy if exists "Update own public objects" on storage.objects;
create policy "Update own public objects"
  on storage.objects for update
  using (bucket_id = 'public' and owner = auth.uid())
  with check (bucket_id = 'public' and owner = auth.uid());

drop policy if exists "Private read own" on storage.objects;
create policy "Private read own"
  on storage.objects for select
  using (bucket_id = 'private' and owner = auth.uid());

drop policy if exists "Private write own" on storage.objects;
create policy "Private write own"
  on storage.objects for insert
  with check (bucket_id = 'private' and owner = auth.uid());

drop policy if exists "Private update own" on storage.objects;
create policy "Private update own"
  on storage.objects for update
  using (bucket_id = 'private' and owner = auth.uid())
  with check (bucket_id = 'private' and owner = auth.uid());

