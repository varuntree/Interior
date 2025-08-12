# Phase 5: Collections & Organization APIs
## Complete Renders, Collections, and Community Endpoints

### Phase Overview
**Duration**: 1 day
**Dependencies**: Phases 1-4 completed
**Goal**: Implement all organization features - renders list, collections CRUD, community

### Required Reading Before Starting
1. `/ai_docs/spec/system_architecture_and_api.md` - API contracts (Sections 6.3-6.5)
2. `/ai_docs/spec/prd.md` - Collections and community requirements
3. `/ai_docs/docs/01-handbook.md` - API standards
4. `/ai_docs/docs/02-playbooks-and-templates.md` - API route template

---

## Task 5.1: Renders API

### Create Renders List Endpoint
Location: `app/api/v1/renders/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, unauthorized, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient, getUserFromRequest } from '@/libs/api-utils/supabase'
import * as rendersService from '@/libs/services/renders'
import { ServiceError } from '@/libs/services/types'

const QuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  mode: z.string().optional(),
  roomType: z.string().optional(),
  style: z.string().optional()
})

export const GET = withMethods(['GET'], async (req: NextRequest) => {
  try {
    // Authenticate user
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse({
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      mode: searchParams.get('mode') || undefined,
      roomType: searchParams.get('roomType') || undefined,
      style: searchParams.get('style') || undefined
    })
    
    // Create service context
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    // Get renders
    const result = await rendersService.listRenders(
      ctx,
      user.id,
      {
        mode: query.mode,
        roomType: query.roomType,
        style: query.style
      },
      {
        limit: query.limit || 24,
        cursor: query.cursor
      }
    )
    
    return ok({
      items: result.items,
      nextCursor: result.nextCursor
    })
    
  } catch (error) {
    if (error instanceof ServiceError) {
      return serverError(error.message)
    }
    
    console.error('Error listing renders:', error)
    return serverError('Failed to list renders')
  }
})
```

### Create Render Detail Endpoint
Location: `app/api/v1/renders/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, unauthorized, notFound, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient, getUserFromRequest } from '@/libs/api-utils/supabase'
import * as rendersService from '@/libs/services/renders'
import { ServiceError } from '@/libs/services/types'

interface Params {
  params: {
    id: string
  }
}

export const GET = withMethods(['GET'], async (req: NextRequest, { params }: Params) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    const render = await rendersService.getRenderDetails(
      ctx,
      params.id,
      user.id
    )
    
    if (!render) {
      return notFound('Render not found')
    }
    
    return ok(render)
    
  } catch (error) {
    if (error instanceof ServiceError) {
      return serverError(error.message)
    }
    
    console.error('Error fetching render:', error)
    return serverError('Failed to fetch render')
  }
})

export const DELETE = withMethods(['DELETE'], async (req: NextRequest, { params }: Params) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    await rendersService.deleteRender(ctx, params.id, user.id)
    
    return ok({ deleted: true })
    
  } catch (error) {
    if (error instanceof ServiceError) {
      if (error.code === 'NOT_FOUND') {
        return notFound('Render not found')
      }
      return serverError(error.message)
    }
    
    console.error('Error deleting render:', error)
    return serverError('Failed to delete render')
  }
})
```

---

## Task 5.2: Collections API

### Create Collections Endpoints
Location: `app/api/v1/collections/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, created, unauthorized, validationError, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient, getUserFromRequest } from '@/libs/api-utils/supabase'
import * as collectionsService from '@/libs/services/collections'
import { ServiceError } from '@/libs/services/types'

const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100)
})

export const GET = withMethods(['GET'], async (req: NextRequest) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    const collections = await collectionsService.listCollections(ctx, user.id)
    
    // Ensure default favorites exists
    await collectionsService.ensureDefaultFavorites(ctx, user.id)
    
    return ok(collections)
    
  } catch (error) {
    if (error instanceof ServiceError) {
      return serverError(error.message)
    }
    
    console.error('Error listing collections:', error)
    return serverError('Failed to list collections')
  }
})

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    const body = await req.json()
    const parsed = CreateCollectionSchema.safeParse(body)
    
    if (!parsed.success) {
      return validationError('Invalid request', parsed.error.flatten())
    }
    
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    const collection = await collectionsService.createCollection(
      ctx,
      user.id,
      parsed.data.name
    )
    
    return created(collection, 'Collection created successfully')
    
  } catch (error) {
    if (error instanceof ServiceError) {
      if (error.code === 'VALIDATION_ERROR') {
        return validationError(error.message)
      }
      return serverError(error.message)
    }
    
    console.error('Error creating collection:', error)
    return serverError('Failed to create collection')
  }
})
```

### Create Collection Management Endpoints
Location: `app/api/v1/collections/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, unauthorized, notFound, validationError, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient, getUserFromRequest } from '@/libs/api-utils/supabase'
import * as collectionsService from '@/libs/services/collections'
import * as collectionsRepo from '@/libs/repositories/collections'
import { ServiceError } from '@/libs/services/types'

interface Params {
  params: {
    id: string
  }
}

const UpdateCollectionSchema = z.object({
  name: z.string().min(1).max(100)
})

export const PATCH = withMethods(['PATCH'], async (req: NextRequest, { params }: Params) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    const body = await req.json()
    const parsed = UpdateCollectionSchema.safeParse(body)
    
    if (!parsed.success) {
      return validationError('Invalid request', parsed.error.flatten())
    }
    
    const supabase = createServiceSupabaseClient()
    
    await collectionsRepo.renameCollection(
      supabase,
      params.id,
      user.id,
      parsed.data.name
    )
    
    return ok({ updated: true })
    
  } catch (error) {
    console.error('Error updating collection:', error)
    return serverError('Failed to update collection')
  }
})

export const DELETE = withMethods(['DELETE'], async (req: NextRequest, { params }: Params) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    await collectionsService.deleteCollection(ctx, user.id, params.id)
    
    return ok({ deleted: true })
    
  } catch (error) {
    if (error instanceof ServiceError) {
      if (error.code === 'NOT_FOUND') {
        return notFound('Collection not found')
      }
      if (error.code === 'VALIDATION_ERROR') {
        return validationError(error.message)
      }
      return serverError(error.message)
    }
    
    console.error('Error deleting collection:', error)
    return serverError('Failed to delete collection')
  }
})
```

### Create Collection Items Endpoints
Location: `app/api/v1/collections/[id]/items/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, created, unauthorized, validationError, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient, getUserFromRequest } from '@/libs/api-utils/supabase'
import * as collectionsRepo from '@/libs/repositories/collections'
import { ServiceError } from '@/libs/services/types'

interface Params {
  params: {
    id: string
  }
}

const AddItemSchema = z.object({
  renderId: z.string().uuid()
})

export const GET = withMethods(['GET'], async (req: NextRequest, { params }: Params) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    const supabase = createServiceSupabaseClient()
    
    // Verify collection ownership
    const collections = await collectionsRepo.listCollections(supabase, user.id)
    const collection = collections.find(c => c.id === params.id)
    
    if (!collection) {
      return notFound('Collection not found')
    }
    
    const items = await collectionsRepo.listCollectionItems(supabase, params.id)
    
    return ok(items)
    
  } catch (error) {
    console.error('Error listing collection items:', error)
    return serverError('Failed to list collection items')
  }
})

export const POST = withMethods(['POST'], async (req: NextRequest, { params }: Params) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    const body = await req.json()
    const parsed = AddItemSchema.safeParse(body)
    
    if (!parsed.success) {
      return validationError('Invalid request', parsed.error.flatten())
    }
    
    const supabase = createServiceSupabaseClient()
    
    // Verify collection ownership
    const collections = await collectionsRepo.listCollections(supabase, user.id)
    const collection = collections.find(c => c.id === params.id)
    
    if (!collection) {
      return notFound('Collection not found')
    }
    
    await collectionsRepo.addToCollection(
      supabase,
      params.id,
      parsed.data.renderId
    )
    
    return created({ added: true }, 'Added to collection')
    
  } catch (error) {
    console.error('Error adding to collection:', error)
    return serverError('Failed to add to collection')
  }
})
```

### Create Remove from Collection Endpoint
Location: `app/api/v1/collections/[id]/items/[renderId]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, unauthorized, notFound, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient, getUserFromRequest } from '@/libs/api-utils/supabase'
import * as collectionsRepo from '@/libs/repositories/collections'

interface Params {
  params: {
    id: string
    renderId: string
  }
}

export const DELETE = withMethods(['DELETE'], async (req: NextRequest, { params }: Params) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    const supabase = createServiceSupabaseClient()
    
    // Verify collection ownership
    const collections = await collectionsRepo.listCollections(supabase, user.id)
    const collection = collections.find(c => c.id === params.id)
    
    if (!collection) {
      return notFound('Collection not found')
    }
    
    await collectionsRepo.removeFromCollection(
      supabase,
      params.id,
      params.renderId
    )
    
    return ok({ removed: true })
    
  } catch (error) {
    console.error('Error removing from collection:', error)
    return serverError('Failed to remove from collection')
  }
})
```

### Create Add to Favorites Shortcut
Location: `app/api/v1/favorites/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, created, unauthorized, validationError, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient, getUserFromRequest } from '@/libs/api-utils/supabase'
import * as collectionsService from '@/libs/services/collections'
import { ServiceError } from '@/libs/services/types'

const AddToFavoritesSchema = z.object({
  renderId: z.string().uuid()
})

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return unauthorized('Authentication required')
    }
    
    const body = await req.json()
    const parsed = AddToFavoritesSchema.safeParse(body)
    
    if (!parsed.success) {
      return validationError('Invalid request', parsed.error.flatten())
    }
    
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase, user }
    
    await collectionsService.addToFavorites(ctx, user.id, parsed.data.renderId)
    
    return created({ added: true }, 'Added to favorites')
    
  } catch (error) {
    if (error instanceof ServiceError) {
      if (error.code === 'NOT_FOUND') {
        return notFound('Render not found')
      }
      return serverError(error.message)
    }
    
    console.error('Error adding to favorites:', error)
    return serverError('Failed to add to favorites')
  }
})
```

---

## Task 5.3: Community API

### Create Community Endpoints
Location: `app/api/v1/community/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import * as communityService from '@/libs/services/community'

export const GET = withMethods(['GET'], async (req: NextRequest) => {
  try {
    // No authentication required for public read
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase }
    
    const collections = await communityService.listCommunityCollections(ctx)
    
    // For each collection, get a preview of items
    const collectionsWithPreviews = await Promise.all(
      collections.map(async (collection) => {
        const details = await communityService.getCommunityCollection(
          ctx,
          collection.id
        )
        
        return {
          ...collection,
          itemCount: details?.items.length || 0,
          previewItems: details?.items.slice(0, 4) || []
        }
      })
    )
    
    return ok(collectionsWithPreviews)
    
  } catch (error) {
    console.error('Error listing community collections:', error)
    return serverError('Failed to list community collections')
  }
})
```

### Create Community Collection Detail
Location: `app/api/v1/community/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, notFound, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import * as communityService from '@/libs/services/community'

interface Params {
  params: {
    id: string
  }
}

export const GET = withMethods(['GET'], async (req: NextRequest, { params }: Params) => {
  try {
    const supabase = createServiceSupabaseClient()
    const ctx = { supabase }
    
    const collection = await communityService.getCommunityCollection(
      ctx,
      params.id
    )
    
    if (!collection) {
      return notFound('Community collection not found')
    }
    
    return ok(collection)
    
  } catch (error) {
    console.error('Error fetching community collection:', error)
    return serverError('Failed to fetch community collection')
  }
})
```

---

## Verification Steps

### Step 1: Test Renders API
```bash
# List renders
curl http://localhost:3000/api/v1/renders?limit=10 \
  -H "Authorization: Bearer TOKEN"

# Get render detail
curl http://localhost:3000/api/v1/renders/RENDER_ID \
  -H "Authorization: Bearer TOKEN"

# Delete render
curl -X DELETE http://localhost:3000/api/v1/renders/RENDER_ID \
  -H "Authorization: Bearer TOKEN"
```

### Step 2: Test Collections API
```bash
# List collections
curl http://localhost:3000/api/v1/collections \
  -H "Authorization: Bearer TOKEN"

# Create collection
curl -X POST http://localhost:3000/api/v1/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name": "My Project"}'

# Add to collection
curl -X POST http://localhost:3000/api/v1/collections/COLLECTION_ID/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"renderId": "RENDER_ID"}'

# Add to favorites (shortcut)
curl -X POST http://localhost:3000/api/v1/favorites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"renderId": "RENDER_ID"}'
```

### Step 3: Test Community API
```bash
# List community collections (public)
curl http://localhost:3000/api/v1/community

# Get community collection detail
curl http://localhost:3000/api/v1/community/COLLECTION_ID
```

### Step 4: Verify Pagination
```javascript
// Test cursor pagination
async function testPagination() {
  let cursor = null
  let allItems = []
  
  do {
    const url = cursor 
      ? `/api/v1/renders?cursor=${cursor}&limit=5`
      : '/api/v1/renders?limit=5'
    
    const response = await fetch(url, {
      headers: { 'Authorization': 'Bearer TOKEN' }
    })
    
    const data = await response.json()
    allItems.push(...data.data.items)
    cursor = data.data.nextCursor
  } while (cursor)
  
  console.log('Total items:', allItems.length)
}
```

---

## Success Criteria
- [ ] Renders list with filtering works
- [ ] Pagination with cursor works
- [ ] Collections CRUD operations work
- [ ] Default favorites auto-created
- [ ] Add/remove from collections works
- [ ] Community collections publicly readable
- [ ] All endpoints return normalized responses
- [ ] Proper authorization checks

---

## Common Issues & Solutions

### Issue: Collections not showing favorites
**Solution**: Ensure trigger from Phase 1 migration is applied

### Issue: Pagination returning duplicates
**Solution**: Check cursor-based ordering is by created_at DESC

### Issue: Community collections empty
**Solution**: Manually insert test data via Supabase dashboard

### Issue: Can't add render to collection
**Solution**: Verify render belongs to user and collection exists

---

## Performance Optimization

### Caching Strategy
```typescript
// Add cache headers for community endpoints
return ok(data, {
  headers: {
    'Cache-Control': 'public, max-age=300' // 5 minutes for community
  }
})
```

### Query Optimization
- Use database indexes from Phase 1
- Limit default page size to 24 items
- Consider adding Redis cache layer later

---

## Next Phase Preview
Phase 6 will build the complete dashboard UI:
- Create page with all 4 modes
- Results display and actions
- Collections management UI
- Community inspiration gallery
- Mobile-responsive layouts

Ensure all APIs work correctly before building the UI.