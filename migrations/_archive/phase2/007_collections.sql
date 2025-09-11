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

