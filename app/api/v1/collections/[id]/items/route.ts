// app/api/v1/collections/[id]/items/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, fail } from '@/libs/api-utils/responses'
import { withMethodsCtx } from '@/libs/api-utils/methods'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { createClient } from '@/libs/supabase/server'
import { 
  getCollectionWithItems, 
  addRenderToCollection,
  addCommunityImageToCollection,
  addToFavorites,
  addCommunityToFavorites,
} from '@/libs/services/collections'
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic'

interface Context {
  params: { id: string }
}

// Validation schemas
const AddItemSchema = z.object({
  renderId: z.string().uuid('Invalid render ID format')
})

const AddCommunityItemSchema = z.object({
  communityImageId: z.string().uuid('Invalid community image ID format')
})

const BatchAddItemsSchema = z.object({
  renderIds: z.array(z.string().uuid()).min(1).max(50)
})

async function handleGET(req: NextRequest, ctx: Context & { logger?: any }) {
  try {
    const { id: collectionId } = ctx.params

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
      items: paginatedItems.map((item: any) => item.render ? {
        type: 'render' as const,
        renderId: item.render_id,
        addedAt: item.added_at,
        render: {
          id: item.render.id,
          mode: item.render.mode,
          roomType: item.render.room_type,
          style: item.render.style,
          coverVariant: item.render.cover_variant,
          coverImageUrl: item.render.cover_image_url,
          createdAt: item.render.created_at
        }
      } : {
        type: 'community' as const,
        communityImageId: item.community_image_id,
        addedAt: item.added_at,
        imageUrl: item.image_url,
        thumbUrl: item.thumb_url,
        applySettings: item.apply_settings,
      }),
      pagination: {
        limit,
        offset,
        hasMore: (offset + limit) < result.items.length,
        total: result.items.length
      }
    }

    ctx?.logger?.info?.('collections.items.list', { userId: user.id, collectionId, count: response.items.length })
    return ok(response)

  } catch (error: any) {
    ctx?.logger?.error?.('collections.items.list_error', { message: error?.message })
    
    if (error.message === 'Collection not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Collection not found or access denied')
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch collection items')
  }
}

async function handlePOST(req: NextRequest, ctx: Context & { logger?: any }) {
  try {
    const { id: collectionId } = ctx.params

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

      ctx?.logger?.info?.('collections.items.batch_add', { userId: user.id, collectionId, count: parsed.data.renderIds.length })
      return ok({ 
        message: `${parsed.data.renderIds.length} render(s) added to collection successfully`,
        addedCount: parsed.data.renderIds.length
      })
    } else {
      // Single item add
      const parsedRender = AddItemSchema.safeParse(body)
      const parsedCommunity = AddCommunityItemSchema.safeParse(body)
      if (!parsedRender.success && !parsedCommunity.success) {
        return fail(400, 'VALIDATION_ERROR', 'Invalid request body')
      }

      // Get service client
      const serviceSupabase = createServiceSupabaseClient()

      // Special case: if this is the "favorites" shortcut
      if (collectionId === 'favorites') {
        if (parsedRender.success) {
          await addToFavorites({ supabase: serviceSupabase }, user.id, parsedRender.data.renderId)
        } else if (parsedCommunity.success) {
          await addCommunityToFavorites({ supabase: serviceSupabase }, user.id, parsedCommunity.data.communityImageId)
        }
      } else {
        if (parsedRender.success) {
          await addRenderToCollection(
            { supabase: serviceSupabase },
            user.id,
            collectionId,
            parsedRender.data.renderId
          )
        } else if (parsedCommunity.success) {
          await addCommunityImageToCollection(
            { supabase: serviceSupabase },
            user.id,
            collectionId,
            parsedCommunity.data.communityImageId
          )
        }
      }

      ctx?.logger?.info?.('collections.items.add', { userId: user.id, collectionId })
      return ok({ message: 'Render added to collection successfully' })
    }

  } catch (error: any) {
    ctx?.logger?.error?.('collections.items.add_error', { message: error?.message })
    
    if (error.message === 'Collection not found or access denied' || error.message === 'Render not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Collection or render not found or access denied')
    }
    
    if (error.message === 'Some renders not found or access denied') {
      return fail(400, 'VALIDATION_ERROR', 'Some renders not found or access denied')
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to add render(s) to collection')
  }
}

export const GET = withMethodsCtx(['GET'], withRequestContext(handleGET) as any)
export const POST = withMethodsCtx(['POST'], withRequestContext(handlePOST) as any)
