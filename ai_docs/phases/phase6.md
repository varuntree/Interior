PHASE_06__community-and-admin-curation.md
1) Title & Goal
Community & Admin Curation: a public Community page featuring admin‑curated collections of inspirational renders. Add a tiny admin surface (under Dashboard) to publish/update these collections.

2) Scope (In/Out)
In

Public /community page listing “curated collections”; each collection has items (images + labels).

Admin‑only CRUD for community collections/items (simple form; image upload).

Storage: curated images live in public bucket.

Minimal admin gating via admins table + RLS (no service‑role usage).

Out

User comments/likes/sharing.

Search, tags filtering (we’ll keep a simple tag field but no filter UI yet).

Moderation queues, versioning, or drafts (use is_published boolean).

3) Spec References
specs/01-prd.md — “Community” inspiration surface.

specs/03-data-model-and-storage.md — RLS patterns, storage.

specs/04-ui-ux.md — Sidebar item for Community, card grid patterns.

docs/01-handbook.md — Golden path, RLS, no service role outside webhooks.

docs/02-playbooks-and-templates.md — Upload to Supabase Storage (public).

4) Planned Changes (by layer)
4.1 Database (migrations)
migrations/phase6/009_create_admins.sql

sql
Copy
create table if not exists public.admins (
  owner_id uuid primary key,
  email text unique,
  created_at timestamptz default now()
);
alter table public.admins enable row level security;

-- Only owner can read/insert/delete their admin row (self‑service “ensure me admin”)
create policy "admins_owner_select" on public.admins for select
  using (auth.uid() = owner_id);
create policy "admins_owner_insert" on public.admins for insert
  with check (auth.uid() = owner_id);
create policy "admins_owner_delete" on public.admins for delete
  using (auth.uid() = owner_id);

-- Helper view to check admin capability for the current user
create or replace view public.me_is_admin as
  select true as is_admin
  from public.admins a
  where a.owner_id = auth.uid();
migrations/phase6/010_create_community.sql

sql
Copy
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
Why this design?
Public read needs no auth; writes need admin membership enforced at DB via RLS (no service role). An “ensure admin” step lets you self‑register as admin via API if your email is on an allowlist (see below).

4.2 Repositories
libs/repositories/admins.ts

ensureAdmin(supabase, { userId, email }): Promise<{ isAdmin: boolean }>

isAdmin(supabase): Promise<boolean> (query me_is_admin view)

libs/repositories/community.ts

Collections: listPublished, listAllAdmin, upsert, setPublished, remove, reorder.

Items: listByCollectionPublished, listByCollectionAdmin, upsert, remove, reorder.

4.3 Services
libs/services/admin.ts

bootstrapAdmin(ctx, { allowlistEmails: string[] }): if current user email ∈ allowlist → upsert into admins.

libs/services/community.ts

Thin orchestration for repos + storage helper.

4.4 API Routes
Public (read‑only)

app/api/v1/community/collections/route.ts (GET) → published collections (grid)

app/api/v1/community/collections/[id]/items/route.ts (GET) → published items

Admin (write)

app/api/v1/admin/ensure/route.ts (POST)

Body: none. Reads server env ADMIN_EMAILS (comma‑sep). If current user email is on the list → ensureAdmin.

app/api/v1/admin/community/collections/upsert/route.ts (POST)

app/api/v1/admin/community/collections/publish/route.ts (POST)

app/api/v1/admin/community/collections/delete/route.ts (POST)

app/api/v1/admin/community/items/upsert/route.ts (POST)

app/api/v1/admin/community/items/delete/route.ts (POST)

All follow the API_ROUTE template (validate → service → ok()/fail()).

4.5 Storage
libs/storage/community.ts

Upload curated images to public bucket at community/{collectionId}/{filename}.

Return public URL for display.

4.6 UI
Public

app/(marketing)/community/page.tsx: collections grid (title, cover, badge).

app/(marketing)/community/[collectionId]/page.tsx: gallery grid of items.

Admin (under Dashboard)

app/(app)/dashboard/admin/community/page.tsx: minimal panel

Button: “Ensure Admin” → calls /api/v1/admin/ensure

Create/rename collection; upload/replace cover; publish toggle.

Add items (upload image, optional title/tags); delete/reorder (drag optional).

4.7 Config & Env
Add ADMIN_EMAILS to .env.example (comma‑separated). Example:

graphql
Copy
ADMIN_EMAILS=you@example.com,designer@example.com
5) Constraints & Guardrails
No service‑role usage.

RLS enforced for admin writes and public reads.

Public images only in public bucket; generation inputs remain in private.

6) Acceptance Criteria
/community visible to logged‑out users; loads published content.

Admin can self‑enable via allowlist and manage collections/items.

Publishing toggles visibility immediately.

Build + greps green; no Server Actions; responses normalized.

7) Artifacts
ai_docs/changes/PHASE_06__change_spec.md

ai_docs/reports/PHASE_06__qa-report.md

