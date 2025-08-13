create table if not exists public.community_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image_url text,
  is_published boolean not null default false,
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.community_collections enable row level security;

create table if not exists public.community_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.community_collections(id) on delete cascade,
  title text,
  image_url text not null,
  tags text[],
  position int default 0,
  created_at timestamptz default now()
);
alter table public.community_items enable row level security;

-- RLS: public read for published collections/items
create policy "collections_public_read" on public.community_collections for select
  using (is_published = true);
create policy "items_public_read" on public.community_items for select
  using (exists (
    select 1 from public.community_collections c
    where c.id = community_items.collection_id and c.is_published = true
  ));

-- Admin writes: allowed only if the current user appears in admins
create policy "collections_admin_all" on public.community_collections
  for all using (exists (select 1 from public.admins a where a.owner_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.owner_id = auth.uid()));

create policy "items_admin_all" on public.community_items
  for all using (exists (select 1 from public.admins a where a.owner_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.owner_id = auth.uid()));