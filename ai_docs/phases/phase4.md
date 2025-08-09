PHASE_04__favorites-and-collections.md
1) Title & Goal
Save & Organize: let users favorite renders and (optionally) group them into simple collections/projects.

2) Scope (In/Out)
In

Favorites (MVP, required):

Heart toggle on any generation result (stores per‑user favorite).

List view under “My Favorites”.

Collections (simple; recommended but can be toggled off initially):

Create/rename/delete user collections.

Add/remove a generation to a collection.

List collections and items (paginated).

Out

Sharing/public links, comments, collaboration.

Reordering; cover images (nice-to-have later).

3) Spec References
specs/01-prd.md — Save, revisit, inspiration loop.

specs/03-data-model-and-storage.md — Entities.

specs/04-ui-ux.md — Sidebar nav, cards, empty states.

docs/01-handbook.md — RLS patterns and boundaries.

4) Planned Changes (by layer)
API routes
Favorites

Add app/api/v1/favorites/toggle/route.ts (POST)

Body: { generationId: string }

Toggle favorite for current user (create if missing; else delete).

Return { isFavorited: boolean }.

Add app/api/v1/favorites/list/route.ts (GET)

Query: ?cursor=<uuid>&limit=24 (or simple ?page=1&limit=24).

Returns a list of favorited generation cards (join on generations), newest first.

Collections (optional)

Add app/api/v1/collections/upsert/route.ts (POST)

Body: { id?: string; title: string } (create or rename)

Add app/api/v1/collections/delete/route.ts (POST)

Body: { id: string }

Add app/api/v1/collections/list/route.ts (GET)

Returns { collections: Array<{id,title,itemsCount}> }

Add app/api/v1/collections/items/toggle/route.ts (POST)

Body: { collectionId: string; generationId: string }

Services
Add libs/services/favorites.ts

toggleFavorite(ctx, { userId, generationId })

listFavorites(ctx, { userId, cursor?, limit })

Add libs/services/collections.ts (if enabled)

upsertCollection(ctx, { userId, id?, title })

deleteCollection(ctx, { userId, id })

listCollections(ctx, { userId })

toggleItem(ctx, { userId, collectionId, generationId })

Repositories / DB
Add migration migrations/phase4/007_create_favorites.sql

sql
Copy
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  generation_id uuid not null references public.generations(id) on delete cascade,
  created_at timestamptz default now(),
  unique (owner_id, generation_id)
);
alter table public.favorites enable row level security;

create policy "favorites_owner_select" on public.favorites for select
  using (auth.uid() = owner_id);
create policy "favorites_owner_insert" on public.favorites for insert
  with check (auth.uid() = owner_id);
create policy "favorites_owner_delete" on public.favorites for delete
  using (auth.uid() = owner_id);
Add migration migrations/phase4/008_create_collections.sql (optional)

sql
Copy
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  created_at timestamptz default now()
);
alter table public.collections enable row level security;

create policy "collections_owner_select" on public.collections for select
  using (auth.uid() = owner_id);
create policy "collections_owner_insert" on public.collections for insert
  with check (auth.uid() = owner_id);
create policy "collections_owner_update" on public.collections for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "collections_owner_delete" on public.collections for delete
  using (auth.uid() = owner_id);

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  generation_id uuid not null references public.generations(id) on delete cascade,
  owner_id uuid not null,
  created_at timestamptz default now(),
  primary key (collection_id, generation_id)
);
alter table public.collection_items enable row level security;

create policy "collection_items_owner_select" on public.collection_items for select
  using (auth.uid() = owner_id);
create policy "collection_items_owner_insert" on public.collection_items for insert
  with check (auth.uid() = owner_id);
create policy "collection_items_owner_delete" on public.collection_items for delete
  using (auth.uid() = owner_id);
Add repos:

libs/repositories/favorites.ts

libs/repositories/collections.ts

Provide pure CRUD/list helpers + simple cursor/paging.

UI
Add app/(app)/dashboard/favorites/page.tsx

Grid of favorite renders (card with image, created_at, style/room badges).

Empty state with CTA “Generate your first render”.

Add (optional) app/(app)/dashboard/collections/page.tsx

List of user collections; click to view items (simple nested route or same page modal).

Update generation cards (wherever rendered):

Heart button (client) → POST toggle; optimistic UI; toast on error.

(Optional) “Add to collection” dropdown.

Config
None.

5) Replicate usage
None (read‑only stage for outputs already generated).

6) Constraints & Guardrails
RLS must prevent cross‑user access by design.

Favorites toggle must be idempotent and resilient (unique constraint).

No Server Actions; keep normalized JSON.

7) Acceptance Criteria
Toggle favorite on any generation → reflects immediately; idempotent.

Favorites list paginates; only current user’s data visible.

(If enabled) Collections can be created/renamed/deleted; items toggle works; counts correct.

Build + greps green.

8) Artifacts
ai_docs/changes/PHASE_04__change_spec.md

ai_docs/reports/PHASE_04__qa-report.md

