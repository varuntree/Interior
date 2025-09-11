-- Admin-curated, public read
create table if not exists public.community_collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_featured boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.community_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.community_collections(id) on delete cascade,
  -- references an internal render OR an external asset (one of the two)
  render_id uuid,
  external_image_url text,
  apply_settings jsonb,     -- prefill settings { mode, roomType, style, prompt, aspectRatio, quality, variants }
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  constraint community_item_src check (
    (render_id is not null) <> (external_image_url is not null)
  )
);

-- Public read, admin write enforced at API layer (service-role bypasses RLS on writes if needed)
alter table public.community_collections enable row level security;
alter table public.community_items enable row level security;

drop policy if exists "comm_read" on public.community_collections;
create policy "comm_read"
  on public.community_collections for select
  using (true);

drop policy if exists "comm_items_read" on public.community_items;
create policy "comm_items_read"
  on public.community_items for select
  using (true);

-- Indexes
create index if not exists idx_comm_collections_order on public.community_collections (is_featured desc, order_index asc, created_at desc);
create index if not exists idx_comm_items_coll_order on public.community_items (collection_id, order_index asc);

