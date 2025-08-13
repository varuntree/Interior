# Phase 4 Implementation Plan: Favorites & Collections

## Scope

### What Will Change
- **API Layer**: Add 5 new v1 API endpoints for favorites and collections management
- **Service Layer**: Add 2 new service files (favorites.ts, collections.ts)  
- **Repository Layer**: Add 2 new repository files for data access
- **Database**: Add 3 new tables with RLS policies (favorites, collections, collection_items)
- **Types**: Add type definitions for favorites and collections
- **Storage**: No changes needed (read-only operations on existing generation data)

### What Will NOT Change
- All existing guardrail files (per handbook section 0)
- Generation workflow or Replicate integration
- Authentication or authorization system
- Existing API endpoints or UI pages
- Config or environment variables

## API Endpoints

### Favorites
1. **POST /api/v1/favorites/toggle**
   - Auth: Required
   - Body: `z.object({ generationId: z.string().uuid() })`
   - Response: `{ success: true, data: { isFavorited: boolean } }`
   - Behavior: Toggle favorite status (create if missing, delete if exists)

2. **GET /api/v1/favorites/list**
   - Auth: Required
   - Query: `cursor?: string, limit?: number (default 24)`
   - Response: `{ success: true, data: { items: FavoriteItem[], nextCursor?: string } }`
   - Returns: Generation data joined with favorites, newest first

### Collections
3. **POST /api/v1/collections/upsert**
   - Auth: Required
   - Body: `z.object({ id: z.string().uuid().optional(), title: z.string().min(1).max(100) })`
   - Response: `{ success: true, data: Collection }`
   - Behavior: Create new or rename existing collection

4. **DELETE /api/v1/collections/[id]**
   - Auth: Required (owner only)
   - Response: `{ success: true }`
   - Behavior: Delete collection and cascade remove items

5. **POST /api/v1/collections/items/toggle**
   - Auth: Required
   - Body: `z.object({ collectionId: z.string().uuid(), generationId: z.string().uuid() })`
   - Response: `{ success: true, data: { isInCollection: boolean } }`
   - Behavior: Add/remove generation from collection

6. **GET /api/v1/collections**
   - Auth: Required
   - Response: `{ success: true, data: { collections: CollectionSummary[] } }`
   - Returns: User's collections with item counts

## Services & Repositories

### Services Added
- **libs/services/favorites.ts**
  - `toggleFavorite(ctx, { generationId }): Promise<{ isFavorited: boolean }>`
  - `listFavorites(ctx, { cursor?, limit }): Promise<{ items: FavoriteItem[], nextCursor?: string }>`

- **libs/services/collections.ts**  
  - `upsertCollection(ctx, { id?, title }): Promise<Collection>`
  - `deleteCollection(ctx, { id }): Promise<void>`
  - `listCollections(ctx): Promise<{ collections: CollectionSummary[] }>`
  - `toggleCollectionItem(ctx, { collectionId, generationId }): Promise<{ isInCollection: boolean }>`

### Repositories Added
- **libs/repositories/favorites.ts**
  - `toggleFavorite(supabase, userId, generationId)`
  - `listFavoritesByUser(supabase, userId, cursor?, limit)`

- **libs/repositories/collections.ts**
  - `createCollection(supabase, userId, title)`
  - `updateCollection(supabase, id, title)` 
  - `deleteCollection(supabase, id)`
  - `listCollectionsByUser(supabase, userId)`
  - `toggleCollectionItem(supabase, userId, collectionId, generationId)`
  - `getCollectionItemCounts(supabase, userId)`

## Migrations

### migrations/phase4/007_create_favorites.sql
```sql
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (owner_id, generation_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_owner_select" ON public.favorites FOR SELECT 
  USING (auth.uid() = owner_id);
CREATE POLICY "favorites_owner_insert" ON public.favorites FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "favorites_owner_delete" ON public.favorites FOR DELETE 
  USING (auth.uid() = owner_id);

CREATE INDEX idx_favorites_owner_created ON public.favorites(owner_id, created_at DESC);
```

### migrations/phase4/008_create_collections.sql
```sql
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections_owner_select" ON public.collections FOR SELECT 
  USING (auth.uid() = owner_id);
CREATE POLICY "collections_owner_insert" ON public.collections FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "collections_owner_update" ON public.collections FOR UPDATE 
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "collections_owner_delete" ON public.collections FOR DELETE 
  USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.collection_items (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (collection_id, generation_id)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collection_items_owner_select" ON public.collection_items FOR SELECT 
  USING (auth.uid() = owner_id);
CREATE POLICY "collection_items_owner_insert" ON public.collection_items FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "collection_items_owner_delete" ON public.collection_items FOR DELETE 
  USING (auth.uid() = owner_id);

CREATE INDEX idx_collections_owner ON public.collections(owner_id);
CREATE INDEX idx_collection_items_collection ON public.collection_items(collection_id, created_at DESC);
```

## Storage Paths & Buckets

No changes needed. Phase 4 operates on existing generation data and metadata only.

## UI Surfaces/Pages/Components

### Pages to Add
- **app/(app)/dashboard/favorites/page.tsx**
  - Grid layout showing favorited generations
  - Uses existing generation card components
  - Pagination with cursor-based loading
  - Empty state: "No favorites yet. Generate and heart your first render!"

- **app/(app)/dashboard/collections/page.tsx** (Optional)
  - List of user collections with item counts
  - Create/rename/delete collection actions
  - Navigation to collection detail views

### Component Updates
- Update generation result cards (wherever rendered) to include:
  - Heart icon toggle button (client-side optimistic updates)
  - Optional "Add to collection" dropdown (if collections enabled)
  - Visual indication of favorite status

## Replicate/OpenAI Usage

None. This phase only organizes existing generation outputs.

## Acceptance Criteria

1. **Favorites System**
   - ✅ Heart toggle on generation cards works instantly (optimistic UI)
   - ✅ Toggle is idempotent - repeated clicks don't create duplicates
   - ✅ Favorites list shows only current user's favorites (RLS enforced)
   - ✅ Favorites list paginates correctly with cursor-based navigation
   - ✅ Unfavoriting removes item from favorites list immediately

2. **Collections System** (if enabled)
   - ✅ Can create, rename, and delete collections
   - ✅ Can add/remove generations to/from collections
   - ✅ Collection item counts are accurate
   - ✅ Cannot access other users' collections (RLS enforced)
   - ✅ Deleting collection removes all associated items

3. **API Contracts**
   - ✅ All endpoints return normalized JSON `{ success: boolean, data?: T, error?: {...} }`
   - ✅ Proper HTTP status codes (200, 400, 401, 404, 500)
   - ✅ Input validation with Zod schemas
   - ✅ Error handling with specific error codes

4. **Database Integrity**
   - ✅ Foreign key constraints maintain referential integrity
   - ✅ Unique constraints prevent duplicate favorites
   - ✅ RLS policies prevent cross-user data access
   - ✅ Cascading deletes work correctly (generation deletion removes favorites/collection items)

5. **Build & Quality Gates**
   - ✅ `npm run build` passes without warnings
   - ✅ Grep checks return 0 matches for forbidden patterns
   - ✅ All API endpoints accessible and functional
   - ✅ Database migrations can be applied cleanly

## Risk Assessment

**Low Risk**
- No changes to existing generation workflow
- No external service dependencies
- Standard CRUD operations with established patterns

**Mitigation Strategies**
- RLS policies prevent cross-user access
- Foreign key constraints maintain data integrity  
- Idempotent operations prevent duplicate actions
- Comprehensive error handling with fallbacks

## Implementation Sequence

1. **Database Setup** - Apply migrations for tables and RLS policies
2. **Repository Layer** - Implement data access functions
3. **Service Layer** - Implement business logic with proper context handling
4. **API Layer** - Create route handlers with validation and error handling
5. **Type Definitions** - Add TypeScript types for new entities
6. **Testing** - Manual API testing and build verification

## Post-Implementation Verification

1. Create new generation and toggle favorite - verify in database
2. Create collection, add items, verify counts correct
3. Test pagination on favorites list with multiple items
4. Test RLS by attempting cross-user access (should fail)
5. Verify cascading deletes work (delete generation, check favorites removed)

---

**HANDOFF: spec-executor**

**ARTIFACTS:**
- /Users/varunprasad/Desktop/Interior/ai_docs/agents/planner/phase-04/plan.md  
- /Users/varunprasad/Desktop/Interior/ai_docs/agents/planner/phase-04/change_spec.md