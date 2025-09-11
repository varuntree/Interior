-- Create a single, flat community_images table and drop legacy tables

-- Admins table (if not present). Used for RLS writes.
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

-- New simplified community_images table
create table if not exists public.community_images (
  id uuid primary key default gen_random_uuid(),
  -- exactly one source must be present
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

-- Public read of published images
drop policy if exists "comm_images_public_read" on public.community_images;
create policy "comm_images_public_read" on public.community_images for select
  using (is_published = true);

-- Admin all writes gated by admins membership
drop policy if exists "comm_images_admin_all" on public.community_images;
create policy "comm_images_admin_all" on public.community_images
  for all using (exists (select 1 from public.admins a where a.owner_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.owner_id = auth.uid()));

-- Indexes
create index if not exists idx_comm_images_pub_order
  on public.community_images (is_published, order_index asc, created_at desc);

create index if not exists idx_comm_images_tags_gin
  on public.community_images using gin (tags);

-- Optional: jsonb path ops for faster key search
create index if not exists idx_comm_images_apply_settings
  on public.community_images using gin (apply_settings jsonb_path_ops);

-- Drop legacy tables if they exist to remove ambiguity
drop table if exists public.community_items cascade;
drop table if exists public.community_collections cascade;

