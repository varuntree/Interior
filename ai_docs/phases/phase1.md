# Phase 1: Foundation & Data Layer
## Database Schema, Repositories, and Core API Structure

### Phase Overview
**Duration**: 1-2 days
**Dependencies**: Working ShipFast template, Supabase configured
**Goal**: Establish the complete data layer with migrations, repositories, and API utilities

### Required Reading Before Starting
1. `/ai_docs/spec/data_and_storage.md` - Complete schema specification
2. `/ai_docs/spec/system_architecture_and_api.md` - API contracts
3. `/ai_docs/docs/01-handbook.md` - Section 6 (Repositories) and Section 10 (Migrations)
4. `/ai_docs/docs/02-playbooks-and-templates.md` - Repository and migration templates

---

## Task 1.1: Database Migrations

### Create Migration Files
Location: `migrations/phase2/`

#### File: `005_generation_jobs.sql`
```sql
-- generation_jobs: one record per submission to Replicate
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  mode text not null check (mode in ('redesign','staging','compose','imagine')),
  room_type text,
  style text,
  aspect_ratio text not null default '1:1' check (aspect_ratio in ('1:1','3:2','2:3')),
  quality text not null default 'auto' check (quality in ('auto','low','medium','high')),
  variants int not null default 2 check (variants between 1 and 3),
  
  -- inputs (storage paths, never raw blobs)
  input1_path text,
  input2_path text,
  prompt text,
  
  -- replicate tracking
  prediction_id text unique,
  status text not null default 'starting'
    check (status in ('starting','processing','succeeded','failed','canceled')),
  error text,
  idempotency_key uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.generation_jobs enable row level security;

-- RLS policies
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
  using (false); -- only service-role updates

-- Indexes
create index if not exists idx_jobs_owner_created_at 
  on public.generation_jobs (owner_id, created_at desc);
create index if not exists idx_jobs_owner_status 
  on public.generation_jobs (owner_id, status);

-- Per-owner idempotency
drop index if exists uniq_jobs_owner_idem;
create unique index uniq_jobs_owner_idem
  on public.generation_jobs (owner_id, idempotency_key)
  where idempotency_key is not null;
```

#### File: `006_renders.sql`
```sql
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

-- RLS policies
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

-- Variants table
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

-- Indexes
create index if not exists idx_renders_owner_created 
  on public.renders (owner_id, created_at desc);
create index if not exists idx_variants_render_idx 
  on public.render_variants (render_id, idx);
```

#### File: `007_collections.sql`
```sql
-- collections: user-defined groups with default "My Favorites"
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  is_default_favorites boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.collections enable row level security;

-- RLS policies
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

-- Collection items (many-to-many)
create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  render_id uuid not null references public.renders(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, render_id)
);

alter table public.collection_items enable row level security;

-- RLS for collection items
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

create index if not exists idx_coll_items_coll 
  on public.collection_items (collection_id);
```

#### File: `008_community.sql`
```sql
-- Admin-curated collections, public read
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
  render_id uuid,
  external_image_url text,
  apply_settings jsonb,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  constraint community_item_src check (
    (render_id is not null) <> (external_image_url is not null)
  )
);

-- Public read RLS
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
create index if not exists idx_comm_collections_order 
  on public.community_collections (is_featured desc, order_index asc, created_at desc);
create index if not exists idx_comm_items_coll_order 
  on public.community_items (collection_id, order_index asc);
```

#### File: `009_usage_ledger.sql`
```sql
-- usage_ledger: track generation debits/credits
create table if not exists public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  kind text not null check (kind in ('generation_debit','credit_adjustment')),
  amount int not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table public.usage_ledger enable row level security;

-- RLS: owner can read their own
drop policy if exists "usage_owner_select" on public.usage_ledger;
create policy "usage_owner_select"
  on public.usage_ledger for select
  using (auth.uid() = owner_id);

-- Writes from API/service only
drop policy if exists "usage_owner_insert" on public.usage_ledger;
create policy "usage_owner_insert"
  on public.usage_ledger for insert
  with check (auth.uid() = owner_id);

create index if not exists idx_usage_owner_created 
  on public.usage_ledger (owner_id, created_at desc);
```

#### File: `010_default_favorites_trigger.sql`
```sql
-- Auto-create "My Favorites" collection on profile creation
create or replace function public.create_default_favorites()
returns trigger as $$
begin
  insert into public.collections (owner_id, name, is_default_favorites)
  values (new.id, 'My Favorites', true)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger after profile insert
drop trigger if exists on_profile_created_create_fav on public.profiles;
create trigger on_profile_created_create_fav
after insert on public.profiles
for each row execute function public.create_default_favorites();
```

---

## Task 1.2: Repository Layer

### Create Repository Files
Location: `libs/repositories/`

#### File: `generation_jobs.ts`
```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export interface GenerationJob {
  id: string
  owner_id: string
  mode: 'redesign' | 'staging' | 'compose' | 'imagine'
  room_type?: string
  style?: string
  aspect_ratio: '1:1' | '3:2' | '2:3'
  quality: 'auto' | 'low' | 'medium' | 'high'
  variants: number
  input1_path?: string
  input2_path?: string
  prompt?: string
  prediction_id?: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  error?: string
  idempotency_key?: string
  created_at: string
  completed_at?: string
}

export async function createJob(
  supabase: SupabaseClient,
  job: Omit<GenerationJob, 'id' | 'created_at'>
): Promise<GenerationJob> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .insert(job)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getJobById(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
): Promise<GenerationJob | null> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function findInflightJobForUser(
  supabase: SupabaseClient,
  ownerId: string
): Promise<GenerationJob | null> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('owner_id', ownerId)
    .in('status', ['starting', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export async function updateJobStatus(
  supabase: SupabaseClient,
  id: string,
  patch: {
    status?: GenerationJob['status']
    error?: string
    prediction_id?: string
    completed_at?: string
  }
): Promise<void> {
  const { error } = await supabase
    .from('generation_jobs')
    .update(patch)
    .eq('id', id)
  
  if (error) throw error
}

export async function findJobByIdempotencyKey(
  supabase: SupabaseClient,
  ownerId: string,
  idempotencyKey: string
): Promise<GenerationJob | null> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export async function findJobByPredictionId(
  supabase: SupabaseClient,
  predictionId: string
): Promise<GenerationJob | null> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('prediction_id', predictionId)
    .maybeSingle()
  
  if (error) throw error
  return data
}
```

#### File: `renders.ts`
```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export interface Render {
  id: string
  job_id: string
  owner_id: string
  mode: string
  room_type?: string
  style?: string
  cover_variant: number
  created_at: string
}

export interface RenderVariant {
  id: string
  render_id: string
  owner_id: string
  idx: number
  image_path: string
  thumb_path?: string
  created_at: string
}

export async function createRender(
  supabase: SupabaseClient,
  render: Omit<Render, 'id' | 'created_at'>
): Promise<Render> {
  const { data, error } = await supabase
    .from('renders')
    .insert(render)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function addVariant(
  supabase: SupabaseClient,
  variant: Omit<RenderVariant, 'id' | 'created_at'>
): Promise<RenderVariant> {
  const { data, error } = await supabase
    .from('render_variants')
    .insert(variant)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function listRenders(
  supabase: SupabaseClient,
  ownerId: string,
  filters?: {
    mode?: string
    room_type?: string
    style?: string
  },
  pagination?: {
    limit?: number
    cursor?: string
  }
): Promise<{ items: Render[]; nextCursor?: string }> {
  let query = supabase
    .from('renders')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  
  if (filters?.mode) query = query.eq('mode', filters.mode)
  if (filters?.room_type) query = query.eq('room_type', filters.room_type)
  if (filters?.style) query = query.eq('style', filters.style)
  
  const limit = pagination?.limit || 24
  query = query.limit(limit + 1)
  
  if (pagination?.cursor) {
    query = query.lt('created_at', pagination.cursor)
  }
  
  const { data, error } = await query
  if (error) throw error
  
  const hasMore = data.length > limit
  const items = hasMore ? data.slice(0, -1) : data
  const nextCursor = hasMore ? items[items.length - 1].created_at : undefined
  
  return { items, nextCursor }
}

export async function getRenderWithVariants(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
): Promise<{ render: Render; variants: RenderVariant[] } | null> {
  const { data: render, error: renderError } = await supabase
    .from('renders')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single()
  
  if (renderError && renderError.code !== 'PGRST116') throw renderError
  if (!render) return null
  
  const { data: variants, error: variantsError } = await supabase
    .from('render_variants')
    .select('*')
    .eq('render_id', id)
    .order('idx')
  
  if (variantsError) throw variantsError
  
  return { render, variants: variants || [] }
}

export async function deleteRender(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
): Promise<void> {
  const { error } = await supabase
    .from('renders')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId)
  
  if (error) throw error
}
```

#### File: `collections.ts`
```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export interface Collection {
  id: string
  owner_id: string
  name: string
  is_default_favorites: boolean
  created_at: string
}

export interface CollectionItem {
  collection_id: string
  render_id: string
  added_at: string
}

export async function listCollections(
  supabase: SupabaseClient,
  ownerId: string
): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('owner_id', ownerId)
    .order('is_default_favorites', { ascending: false })
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getDefaultFavorites(
  supabase: SupabaseClient,
  ownerId: string
): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_default_favorites', true)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export async function createCollection(
  supabase: SupabaseClient,
  ownerId: string,
  name: string
): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .insert({
      owner_id: ownerId,
      name,
      is_default_favorites: false
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function renameCollection(
  supabase: SupabaseClient,
  id: string,
  ownerId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('collections')
    .update({ name })
    .eq('id', id)
    .eq('owner_id', ownerId)
    .eq('is_default_favorites', false) // Can't rename default
  
  if (error) throw error
}

export async function deleteCollection(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
): Promise<void> {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId)
    .eq('is_default_favorites', false) // Can't delete default
  
  if (error) throw error
}

export async function addToCollection(
  supabase: SupabaseClient,
  collectionId: string,
  renderId: string
): Promise<void> {
  const { error } = await supabase
    .from('collection_items')
    .insert({
      collection_id: collectionId,
      render_id: renderId
    })
    .select() // Use select to handle duplicates gracefully
  
  // Ignore unique constraint violations (item already in collection)
  if (error && error.code !== '23505') throw error
}

export async function removeFromCollection(
  supabase: SupabaseClient,
  collectionId: string,
  renderId: string
): Promise<void> {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('render_id', renderId)
  
  if (error) throw error
}

export async function listCollectionItems(
  supabase: SupabaseClient,
  collectionId: string,
  limit = 50
): Promise<CollectionItem[]> {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data || []
}
```

#### File: `community.ts`
```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export interface CommunityCollection {
  id: string
  title: string
  description?: string
  is_featured: boolean
  order_index: number
  created_at: string
}

export interface CommunityItem {
  id: string
  collection_id: string
  render_id?: string
  external_image_url?: string
  apply_settings?: Record<string, any>
  order_index: number
  created_at: string
}

export async function listCommunityCollections(
  supabase: SupabaseClient
): Promise<CommunityCollection[]> {
  const { data, error } = await supabase
    .from('community_collections')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('order_index')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getCommunityCollectionWithItems(
  supabase: SupabaseClient,
  collectionId: string
): Promise<{ collection: CommunityCollection; items: CommunityItem[] } | null> {
  const { data: collection, error: collectionError } = await supabase
    .from('community_collections')
    .select('*')
    .eq('id', collectionId)
    .single()
  
  if (collectionError && collectionError.code !== 'PGRST116') throw collectionError
  if (!collection) return null
  
  const { data: items, error: itemsError } = await supabase
    .from('community_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('order_index')
  
  if (itemsError) throw itemsError
  
  return { collection, items: items || [] }
}
```

#### File: `usage.ts`
```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export interface UsageEntry {
  id: string
  owner_id: string
  kind: 'generation_debit' | 'credit_adjustment'
  amount: number
  meta?: Record<string, any>
  created_at: string
}

export async function debitGeneration(
  supabase: SupabaseClient,
  ownerId: string,
  jobId: string,
  amount = 1
): Promise<void> {
  const { error } = await supabase
    .from('usage_ledger')
    .insert({
      owner_id: ownerId,
      kind: 'generation_debit',
      amount,
      meta: { jobId }
    })
  
  if (error) throw error
}

export async function getMonthlyUsage(
  supabase: SupabaseClient,
  ownerId: string,
  fromDateUtc: string
): Promise<number> {
  const { data, error } = await supabase
    .from('usage_ledger')
    .select('amount')
    .eq('owner_id', ownerId)
    .eq('kind', 'generation_debit')
    .gte('created_at', fromDateUtc)
  
  if (error) throw error
  
  return (data || []).reduce((sum, entry) => sum + entry.amount, 0)
}

export async function getRemainingGenerations(
  supabase: SupabaseClient,
  ownerId: string,
  monthlyLimit: number
): Promise<number> {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const fromDateUtc = firstDayOfMonth.toISOString()
  
  const used = await getMonthlyUsage(supabase, ownerId, fromDateUtc)
  return Math.max(0, monthlyLimit - used)
}
```

---

## Task 1.3: API Response Utilities

### Update/Create API Utilities
Location: `libs/api-utils/`

#### Update: `responses.ts`
```typescript
import { NextResponse } from 'next/server'

type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  message?: string
}

export function ok<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, message } as const,
    {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': 'application/json'
      }
    }
  )
}

export function created<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, message } as const,
    {
      status: 201,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': 'application/json'
      }
    }
  )
}

export function accepted<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, message } as const,
    {
      status: 202,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': 'application/json'
      }
    }
  )
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: unknown
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, details }
    } as const,
    {
      status,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': 'application/json'
      }
    }
  )
}

export function unauthorized(message = 'Unauthorized'): NextResponse<ApiResponse> {
  return fail(401, 'UNAUTHORIZED', message)
}

export function forbidden(message = 'Forbidden'): NextResponse<ApiResponse> {
  return fail(403, 'FORBIDDEN', message)
}

export function notFound(message = 'Not found'): NextResponse<ApiResponse> {
  return fail(404, 'NOT_FOUND', message)
}

export function conflict(message: string, code = 'CONFLICT'): NextResponse<ApiResponse> {
  return fail(409, code, message)
}

export function validationError(message: string, details?: unknown): NextResponse<ApiResponse> {
  return fail(400, 'VALIDATION_ERROR', message, details)
}

export function limitExceeded(message: string): NextResponse<ApiResponse> {
  return fail(402, 'LIMIT_EXCEEDED', message)
}

export function serverError(message = 'Internal server error', details?: unknown): NextResponse<ApiResponse> {
  return fail(500, 'INTERNAL_ERROR', message, details)
}
```

#### Create: `methods.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { fail } from './responses'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export function withMethods(
  methods: HttpMethod[],
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    if (!methods.includes(req.method as HttpMethod)) {
      return fail(405, 'METHOD_NOT_ALLOWED', `Method ${req.method} not allowed. Use ${methods.join(', ')}`)
    }
    return handler(req)
  }
}
```

#### Update: `supabase.ts`
```typescript
import { createClient } from '@/libs/supabase/server'

export function createServiceSupabaseClient() {
  return createClient()
}

// Helper to get user from request
export async function getUserFromRequest(req: Request) {
  const supabase = createServiceSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}
```

---

## Verification Steps

### Step 1: Apply Migrations
1. Open Supabase SQL Editor
2. Run each migration file in order (005-010)
3. Verify tables created with proper RLS policies

### Step 2: Test Repositories
Create a test file `test-repositories.ts`:

```typescript
import { createClient } from '@/libs/supabase/server'
import * as jobsRepo from '@/libs/repositories/generation_jobs'
import * as rendersRepo from '@/libs/repositories/renders'
import * as collectionsRepo from '@/libs/repositories/collections'

async function testRepositories() {
  const supabase = createClient()
  
  // Test job creation
  const job = await jobsRepo.createJob(supabase, {
    owner_id: 'test-user-id',
    mode: 'imagine',
    aspect_ratio: '1:1',
    quality: 'auto',
    variants: 2,
    status: 'starting'
  })
  console.log('Created job:', job.id)
  
  // Test finding inflight
  const inflight = await jobsRepo.findInflightJobForUser(supabase, 'test-user-id')
  console.log('Inflight job found:', !!inflight)
  
  // Test collections
  const collections = await collectionsRepo.listCollections(supabase, 'test-user-id')
  console.log('Collections count:', collections.length)
}
```

### Step 3: Verify API Utilities
```typescript
// Test response utilities
import { ok, fail, validationError } from '@/libs/api-utils/responses'

// Should return normalized format
const successResponse = ok({ id: '123' }, 'Created successfully')
const errorResponse = validationError('Invalid input', { field: 'mode' })
```

### Step 4: Run Quality Checks
```bash
# Type checking
npm run typecheck

# Build verification
npm run build

# Grep checks - all should return 0
grep -R "createServerClient" app/components || echo "✓ No direct DB in components"
grep -R "SupabaseClient(" app/components || echo "✓ No Supabase client in components"
```

---

## Success Criteria
- [ ] All 6 migration files created and applied
- [ ] All 5 repository files created with pure functions
- [ ] API utilities return normalized responses
- [ ] No type errors
- [ ] Build passes
- [ ] RLS policies verified working
- [ ] Repository functions tested successfully

---

## Common Issues & Solutions

### Issue: Migration fails with "already exists"
**Solution**: Migrations are idempotent, this is expected if re-running

### Issue: RLS policy blocks access
**Solution**: Verify auth.uid() matches owner_id in test data

### Issue: Type errors in repositories
**Solution**: Ensure @supabase/supabase-js types are installed

### Issue: Build fails
**Solution**: Check all imports use relative paths correctly

---

## Next Phase Preview
Phase 2 will build upon this foundation by:
- Creating the runtime configuration system
- Implementing core service layer
- Setting up the API route structure
- Integrating with the repository layer

Make sure all Phase 1 deliverables are complete and tested before proceeding.