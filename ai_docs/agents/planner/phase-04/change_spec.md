# CHANGE SPEC — Phase 4: Favorites & Collections

## 1) Title
Add favorites and collections system with API endpoints, services, repositories, and database migrations.

## 2) Scope
- **Add**: 5 new API endpoints for favorites and collections management
- **Add**: 2 new service files with business logic
- **Add**: 2 new repository files for database access
- **Add**: 2 database migration files with tables and RLS policies
- **Add**: Type definitions for new entities
- **NOT touch**: All existing files, generation workflow, authentication, or UI pages

## 3) Do-Not-Touch List
- Keep these files intact:
  - app/layout.tsx, app/page.tsx, app/error.tsx, app/not-found.tsx
  - app/signin/**/*, app/dashboard/**/*, app/blog/**/*, app/privacy-policy/page.tsx, app/tos/page.tsx
  - app/api/auth/callback/route.ts
  - app/api/stripe/create-checkout/route.ts
  - app/api/stripe/create-portal/route.ts
  - app/api/webhook/stripe/route.ts
  - middleware.ts, config.ts, components/**/*, libs/**/*, types/**/*

## 4) File Operations

### 4.1 Add

#### Database Migrations

**File**: `migrations/phase4/007_create_favorites.sql`
```sql
-- Create favorites table with RLS
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (owner_id, generation_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "favorites_owner_select" ON public.favorites FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "favorites_owner_insert" ON public.favorites FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "favorites_owner_delete" ON public.favorites FOR DELETE 
  USING (auth.uid() = owner_id);

-- Indexes for performance
CREATE INDEX idx_favorites_owner_created ON public.favorites(owner_id, created_at DESC);
```

**File**: `migrations/phase4/008_create_collections.sql`
```sql
-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "collections_owner_select" ON public.collections FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "collections_owner_insert" ON public.collections FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "collections_owner_update" ON public.collections FOR UPDATE 
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "collections_owner_delete" ON public.collections FOR DELETE 
  USING (auth.uid() = owner_id);

-- Create collection items junction table
CREATE TABLE IF NOT EXISTS public.collection_items (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (collection_id, generation_id)
);

-- Enable RLS for collection_items
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collection_items
CREATE POLICY "collection_items_owner_select" ON public.collection_items FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "collection_items_owner_insert" ON public.collection_items FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "collection_items_owner_delete" ON public.collection_items FOR DELETE 
  USING (auth.uid() = owner_id);

-- Indexes for performance
CREATE INDEX idx_collections_owner ON public.collections(owner_id);
CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id, created_at DESC);
```

#### Type Definitions

**File**: `types/favorites.ts`
```typescript
export interface Favorite {
  id: string;
  owner_id: string;
  generation_id: string;
  created_at: string;
}

export interface FavoriteItem {
  id: string;
  generation_id: string;
  prompt: string;
  result_url: string | null;
  result_urls: string[] | null;
  created_at: string;
  status: string;
}

export interface Collection {
  id: string;
  owner_id: string;
  title: string;
  created_at: string;
}

export interface CollectionSummary {
  id: string;
  title: string;
  items_count: number;
  created_at: string;
}

export interface CollectionItem {
  collection_id: string;
  generation_id: string;
  owner_id: string;
  created_at: string;
}
```

#### Repository Files

**File**: `libs/repositories/favorites.ts`
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { Favorite, FavoriteItem } from '@/types/favorites';

export async function toggleFavorite(
  supabase: SupabaseClient,
  userId: string,
  generationId: string
): Promise<{ isFavorited: boolean }> {
  // Check if already favorited
  const { data: existing, error: checkError } = await supabase
    .from('favorites')
    .select('id')
    .eq('owner_id', userId)
    .eq('generation_id', generationId)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Failed to check favorite: ${checkError.message}`);
  }

  if (existing) {
    // Remove favorite
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('owner_id', userId)
      .eq('generation_id', generationId);

    if (deleteError) {
      throw new Error(`Failed to remove favorite: ${deleteError.message}`);
    }

    return { isFavorited: false };
  } else {
    // Add favorite
    const { error: insertError } = await supabase
      .from('favorites')
      .insert({
        owner_id: userId,
        generation_id: generationId
      });

    if (insertError) {
      throw new Error(`Failed to add favorite: ${insertError.message}`);
    }

    return { isFavorited: true };
  }
}

export async function listFavoritesByUser(
  supabase: SupabaseClient,
  userId: string,
  cursor?: string,
  limit: number = 24
): Promise<{ items: FavoriteItem[]; nextCursor?: string }> {
  let query = supabase
    .from('favorites')
    .select(`
      generation_id,
      created_at,
      generations (
        id,
        prompt,
        result_url,
        result_urls,
        status,
        created_at
      )
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: favorites, error } = await query;

  if (error) {
    throw new Error(`Failed to list favorites: ${error.message}`);
  }

  if (!favorites) {
    return { items: [] };
  }

  const items = favorites.slice(0, limit).map((fav: any) => ({
    id: fav.generations.id,
    generation_id: fav.generation_id,
    prompt: fav.generations.prompt,
    result_url: fav.generations.result_url,
    result_urls: fav.generations.result_urls,
    created_at: fav.generations.created_at,
    status: fav.generations.status
  }));

  const nextCursor = favorites.length > limit ? favorites[limit].created_at : undefined;

  return { items, nextCursor };
}

export async function isFavorited(
  supabase: SupabaseClient,
  userId: string,
  generationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('owner_id', userId)
    .eq('generation_id', generationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check favorite status: ${error.message}`);
  }

  return !!data;
}
```

**File**: `libs/repositories/collections.ts`
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { Collection, CollectionSummary, CollectionItem } from '@/types/favorites';

export async function createCollection(
  supabase: SupabaseClient,
  userId: string,
  title: string
): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .insert({
      owner_id: userId,
      title
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create collection: ${error.message}`);
  }

  return data;
}

export async function updateCollection(
  supabase: SupabaseClient,
  id: string,
  title: string
): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .update({ title })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update collection: ${error.message}`);
  }

  return data;
}

export async function deleteCollection(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete collection: ${error.message}`);
  }
}

export async function listCollectionsByUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ collections: CollectionSummary[] }> {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      id,
      title,
      created_at,
      collection_items (count)
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list collections: ${error.message}`);
  }

  const collections = (data || []).map((collection: any) => ({
    id: collection.id,
    title: collection.title,
    created_at: collection.created_at,
    items_count: collection.collection_items?.[0]?.count || 0
  }));

  return { collections };
}

export async function toggleCollectionItem(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string,
  generationId: string
): Promise<{ isInCollection: boolean }> {
  // Check if item already in collection
  const { data: existing, error: checkError } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('collection_id', collectionId)
    .eq('generation_id', generationId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (checkError) {
    throw new Error(`Failed to check collection item: ${checkError.message}`);
  }

  if (existing) {
    // Remove from collection
    const { error: deleteError } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('generation_id', generationId)
      .eq('owner_id', userId);

    if (deleteError) {
      throw new Error(`Failed to remove from collection: ${deleteError.message}`);
    }

    return { isInCollection: false };
  } else {
    // Add to collection
    const { error: insertError } = await supabase
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        generation_id: generationId,
        owner_id: userId
      });

    if (insertError) {
      throw new Error(`Failed to add to collection: ${insertError.message}`);
    }

    return { isInCollection: true };
  }
}

export async function getCollectionById(
  supabase: SupabaseClient,
  id: string
): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get collection: ${error.message}`);
  }

  return data;
}
```

#### Service Files

**File**: `libs/services/favorites.ts`
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import * as favoritesRepo from '@/libs/repositories/favorites';
import { FavoriteItem } from '@/types/favorites';

export interface FavoritesContext {
  supabase: SupabaseClient;
}

export async function toggleFavorite(
  ctx: FavoritesContext,
  args: { userId: string; generationId: string }
): Promise<{ isFavorited: boolean }> {
  const { supabase } = ctx;
  const { userId, generationId } = args;

  return await favoritesRepo.toggleFavorite(supabase, userId, generationId);
}

export async function listFavorites(
  ctx: FavoritesContext,
  args: { userId: string; cursor?: string; limit?: number }
): Promise<{ items: FavoriteItem[]; nextCursor?: string }> {
  const { supabase } = ctx;
  const { userId, cursor, limit = 24 } = args;

  return await favoritesRepo.listFavoritesByUser(supabase, userId, cursor, limit);
}

export async function checkIsFavorited(
  ctx: FavoritesContext,
  args: { userId: string; generationId: string }
): Promise<{ isFavorited: boolean }> {
  const { supabase } = ctx;
  const { userId, generationId } = args;

  const isFavorited = await favoritesRepo.isFavorited(supabase, userId, generationId);
  return { isFavorited };
}
```

**File**: `libs/services/collections.ts`
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import * as collectionsRepo from '@/libs/repositories/collections';
import { Collection, CollectionSummary } from '@/types/favorites';

export interface CollectionsContext {
  supabase: SupabaseClient;
}

export async function upsertCollection(
  ctx: CollectionsContext,
  args: { userId: string; id?: string; title: string }
): Promise<Collection> {
  const { supabase } = ctx;
  const { userId, id, title } = args;

  if (id) {
    // Update existing
    const existing = await collectionsRepo.getCollectionById(supabase, id);
    if (!existing) {
      throw new Error('Collection not found');
    }
    return await collectionsRepo.updateCollection(supabase, id, title);
  } else {
    // Create new
    return await collectionsRepo.createCollection(supabase, userId, title);
  }
}

export async function deleteCollection(
  ctx: CollectionsContext,
  args: { userId: string; id: string }
): Promise<void> {
  const { supabase } = ctx;
  const { id } = args;

  // Verify ownership through RLS
  const existing = await collectionsRepo.getCollectionById(supabase, id);
  if (!existing) {
    throw new Error('Collection not found');
  }

  await collectionsRepo.deleteCollection(supabase, id);
}

export async function listCollections(
  ctx: CollectionsContext,
  args: { userId: string }
): Promise<{ collections: CollectionSummary[] }> {
  const { supabase } = ctx;
  const { userId } = args;

  return await collectionsRepo.listCollectionsByUser(supabase, userId);
}

export async function toggleCollectionItem(
  ctx: CollectionsContext,
  args: { userId: string; collectionId: string; generationId: string }
): Promise<{ isInCollection: boolean }> {
  const { supabase } = ctx;
  const { userId, collectionId, generationId } = args;

  return await collectionsRepo.toggleCollectionItem(supabase, userId, collectionId, generationId);
}
```

#### API Route Files

**File**: `app/api/v1/favorites/toggle/route.ts`
```typescript
import { z } from 'zod';
import { withMethods } from '@/libs/api-utils/handler';
import { validate } from '@/libs/api-utils/validate';
import { ok, unauthorized } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as favoritesService from '@/libs/services/favorites';

const ToggleFavoriteSchema = z.object({
  generationId: z.string().uuid('Generation ID must be a valid UUID')
});

async function handlePOST(req: Request) {
  const supabase = createServiceSupabaseClient();
  
  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return unauthorized('Authentication required');
  }

  const body = await req.json().catch(() => ({}));

  // Validate request body
  const validation = validate(ToggleFavoriteSchema, body);
  if (!validation.ok) {
    return validation.res;
  }

  try {
    const result = await favoritesService.toggleFavorite(
      { supabase },
      {
        userId: user.id,
        generationId: validation.data.generationId
      }
    );

    return ok(result, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

export const POST = withMethods({
  POST: handlePOST
});
```

**File**: `app/api/v1/favorites/list/route.ts`
```typescript
import { z } from 'zod';
import { withMethods } from '@/libs/api-utils/handler';
import { ok, unauthorized } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as favoritesService from '@/libs/services/favorites';

async function handleGET(req: Request) {
  const supabase = createServiceSupabaseClient();
  
  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return unauthorized('Authentication required');
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const limitStr = url.searchParams.get('limit') || '24';
  const limit = Math.min(Math.max(parseInt(limitStr) || 24, 1), 50);

  try {
    const result = await favoritesService.listFavorites(
      { supabase },
      {
        userId: user.id,
        cursor,
        limit
      }
    );

    return ok(result, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

export const GET = withMethods({
  GET: handleGET
});
```

**File**: `app/api/v1/collections/upsert/route.ts`
```typescript
import { z } from 'zod';
import { withMethods } from '@/libs/api-utils/handler';
import { validate } from '@/libs/api-utils/validate';
import { ok, unauthorized } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as collectionsService from '@/libs/services/collections';

const UpsertCollectionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less')
});

async function handlePOST(req: Request) {
  const supabase = createServiceSupabaseClient();
  
  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return unauthorized('Authentication required');
  }

  const body = await req.json().catch(() => ({}));

  // Validate request body
  const validation = validate(UpsertCollectionSchema, body);
  if (!validation.ok) {
    return validation.res;
  }

  try {
    const result = await collectionsService.upsertCollection(
      { supabase },
      {
        userId: user.id,
        id: validation.data.id,
        title: validation.data.title
      }
    );

    return ok(result, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

export const POST = withMethods({
  POST: handlePOST
});
```

**File**: `app/api/v1/collections/[id]/route.ts`
```typescript
import { withMethods } from '@/libs/api-utils/handler';
import { ok, unauthorized, badRequest } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as collectionsService from '@/libs/services/collections';

async function handleDELETE(req: Request) {
  const supabase = createServiceSupabaseClient();
  
  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return unauthorized('Authentication required');
  }

  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();

  if (!id) {
    return badRequest('Collection ID is required');
  }

  try {
    await collectionsService.deleteCollection(
      { supabase },
      {
        userId: user.id,
        id
      }
    );

    return ok({ deleted: true }, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

export const DELETE = withMethods({
  DELETE: handleDELETE
});
```

**File**: `app/api/v1/collections/route.ts`
```typescript
import { withMethods } from '@/libs/api-utils/handler';
import { ok, unauthorized } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as collectionsService from '@/libs/services/collections';

async function handleGET(req: Request) {
  const supabase = createServiceSupabaseClient();
  
  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return unauthorized('Authentication required');
  }

  try {
    const result = await collectionsService.listCollections(
      { supabase },
      {
        userId: user.id
      }
    );

    return ok(result, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

export const GET = withMethods({
  GET: handleGET
});
```

**File**: `app/api/v1/collections/items/toggle/route.ts`
```typescript
import { z } from 'zod';
import { withMethods } from '@/libs/api-utils/handler';
import { validate } from '@/libs/api-utils/validate';
import { ok, unauthorized } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as collectionsService from '@/libs/services/collections';

const ToggleItemSchema = z.object({
  collectionId: z.string().uuid('Collection ID must be a valid UUID'),
  generationId: z.string().uuid('Generation ID must be a valid UUID')
});

async function handlePOST(req: Request) {
  const supabase = createServiceSupabaseClient();
  
  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return unauthorized('Authentication required');
  }

  const body = await req.json().catch(() => ({}));

  // Validate request body
  const validation = validate(ToggleItemSchema, body);
  if (!validation.ok) {
    return validation.res;
  }

  try {
    const result = await collectionsService.toggleCollectionItem(
      { supabase },
      {
        userId: user.id,
        collectionId: validation.data.collectionId,
        generationId: validation.data.generationId
      }
    );

    return ok(result, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

export const POST = withMethods({
  POST: handlePOST
});
```

### 4.2 Modify
No existing files need modification for Phase 4.

## 5) Implementation Notes
- All API routes use `withMethods` helper and return normalized JSON responses
- Input validation with Zod schemas for all POST endpoints
- RLS policies enforce owner-only access to favorites and collections
- Services follow context pattern with SupabaseClient injection
- Repositories use pure functions with proper error handling
- Database migrations include proper indexes for performance
- Foreign key constraints ensure referential integrity with CASCADE deletes

## 6) Post-Apply Checks

1. **Build Check**
   ```bash
   npm run build
   ```
   Must pass without errors.

2. **API Testing**
   - POST `/api/v1/favorites/toggle` with valid generationId returns `{ success: true, data: { isFavorited: boolean } }`
   - GET `/api/v1/favorites/list` returns paginated results
   - POST `/api/v1/collections/upsert` creates and updates collections
   - All endpoints return 401 for unauthenticated requests

3. **Grep Checks**
   ```bash
   grep -R "use server" app libs                    # Must return 0
   grep -R "createServerClient" components          # Must return 0
   grep -R "service_role" app components            # Must return 0
   ```

4. **Database Integrity**
   - Apply migrations and verify tables created with correct RLS policies
   - Test foreign key constraints with cascade deletes
   - Verify unique constraints prevent duplicate favorites

5. **Existing Route Accessibility**
   - `/` (home), `/signin`, `/dashboard`, `/privacy-policy`, `/tos`, `/blog` still reachable
   - Existing generation API endpoints still functional

## 7) Rollback Plan
- Remove all added files listed in section 4.1
- Drop database tables: `DROP TABLE IF EXISTS public.collection_items; DROP TABLE IF EXISTS public.collections; DROP TABLE IF EXISTS public.favorites;`
- Confirm `npm run build` passes after rollback

---

**Implementation Priority**: Database → Repositories → Services → API Routes → Types
**Estimated Effort**: 2-3 hours for experienced developer following established patterns