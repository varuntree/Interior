// app/api/v1/collections/[id]/items/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { createClient } from '@/libs/supabase/server'
import { 
  getCollectionWithItems, 
  addRenderToCollection,
  addToFavorites
} from '@/libs/services/collections'

export const dynamic = 'force-dynamic'

interface Context {
  params: { id: string }
}

// Validation schemas
const AddItemSchema = z.object({
  renderId: z.string().uuid('Invalid render ID format')
})

const BatchAddItemsSchema = z.object({
  renderIds: z.array(z.string().uuid()).min(1).max(50)
})

export async function GET(req: NextRequest, { params }: Context) {
  try {
    const { id: collectionId } = params

    // Get authenticated user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Validate collection ID
    if (!collectionId || typeof collectionId !== 'string') {
      return fail(400, 'VALIDATION_ERROR', 'Invalid collection ID')
    }

    // Parse query parameters
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Get service client
    const serviceSupabase = createServiceSupabaseClient()

    // Get collection items
    const result = await getCollectionWithItems(
      { supabase: serviceSupabase },
      collectionId,
      user.id,
      limit + offset
    )

    // Apply offset manually (simple pagination for MVP)
    const paginatedItems = result.items.slice(offset, offset + limit)

    // Build response
    const response = {
      items: paginatedItems.map(item => ({
        renderId: item.render_id,
        addedAt: item.added_at,
        render: item.render ? {
          id: item.render.id,
          mode: item.render.mode,
          roomType: item.render.room_type,
          style: item.render.style,
          coverVariant: item.render.cover_variant,
          coverImageUrl: item.render.cover_image_url,
          createdAt: item.render.created_at
        } : null
      })),
      pagination: {
        limit,
        offset,
        hasMore: (offset + limit) < result.items.length,
        total: result.items.length
      }
    }

    return ok(response)

  } catch (error: any) {
    console.error('Get collection items error:', error)
    
    if (error.message === 'Collection not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Collection not found or access denied')
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch collection items')
  }
}

export async function POST(req: NextRequest, { params }: Context) {
  try {
    const { id: collectionId } = params

    // Get authenticated user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Validate collection ID
    if (!collectionId || typeof collectionId !== 'string') {
      return fail(400, 'VALIDATION_ERROR', 'Invalid collection ID')
    }

    // Parse and validate request body
    const body = await req.json()
    
    // Check if it's a batch operation
    if (Array.isArray(body.renderIds)) {
      const parsed = BatchAddItemsSchema.safeParse(body)
      if (!parsed.success) {
        return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
      }

      // Get service client
      const serviceSupabase = createServiceSupabaseClient()
      const { batchAddToCollection } = await import('@/libs/services/collections')

      // Batch add to collection
      await batchAddToCollection(
        { supabase: serviceSupabase },
        user.id,
        collectionId,
        parsed.data.renderIds
      )

      return ok({ 
        message: `${parsed.data.renderIds.length} render(s) added to collection successfully`,
        addedCount: parsed.data.renderIds.length
      })
    } else {
      // Single item add
      const parsed = AddItemSchema.safeParse(body)
      if (!parsed.success) {
        return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
      }

      const { renderId } = parsed.data

      // Get service client
      const serviceSupabase = createServiceSupabaseClient()

      // Special case: if this is the "favorites" shortcut
      if (collectionId === 'favorites') {
        await addToFavorites({ supabase: serviceSupabase }, user.id, renderId)
      } else {
        await addRenderToCollection(
          { supabase: serviceSupabase },
          user.id,
          collectionId,
          renderId
        )
      }

      return ok({ message: 'Render added to collection successfully' })
    }

  } catch (error: any) {
    console.error('Add to collection error:', error)
    
    if (error.message === 'Collection not found or access denied' || error.message === 'Render not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Collection or render not found or access denied')
    }
    
    if (error.message === 'Some renders not found or access denied') {
      return fail(400, 'VALIDATION_ERROR', 'Some renders not found or access denied')
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to add render(s) to collection')
  }
}