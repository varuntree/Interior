-- Create collection_community_items to allow saving community images to collections
create table if not exists public.collection_community_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  community_image_id uuid not null references public.community_images(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, community_image_id)
);

alter table public.collection_community_items enable row level security;

-- RLS: owner of the collection controls items
drop policy if exists "coll_comm_items_owner_select" on public.collection_community_items;
create policy "coll_comm_items_owner_select"
  on public.collection_community_items for select
  using (
    exists(select 1 from public.collections c
           where c.id = collection_id and c.owner_id = auth.uid())
  );

drop policy if exists "coll_comm_items_owner_insert" on public.collection_community_items;
create policy "coll_comm_items_owner_insert"
  on public.collection_community_items for insert
  with check (
    exists(select 1 from public.collections c
           where c.id = collection_id and c.owner_id = auth.uid())
  );

drop policy if exists "coll_comm_items_owner_delete" on public.collection_community_items;
create policy "coll_comm_items_owner_delete"
  on public.collection_community_items for delete
  using (
    exists(select 1 from public.collections c
           where c.id = collection_id and c.owner_id = auth.uid())
  );

create index if not exists idx_coll_comm_items_coll on public.collection_community_items (collection_id);

