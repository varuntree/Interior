// app/api/v1/collections/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, fail } from '@/libs/api-utils/responses'
import { withMethodsCtx } from '@/libs/api-utils/methods'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { createClient } from '@/libs/supabase/server'
import { 
  getCollectionWithItems, 
  renameUserCollection, 
  deleteUserCollection 
} from '@/libs/services/collections'
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic'

interface Context {
  params: { id: string }
}

// Validation schemas
const RenameCollectionSchema = z.object({
  name: z.string().min(1).max(100).trim()
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

    // Get service client
    const serviceSupabase = createServiceSupabaseClient()

    // Get collection with items
    const result = await getCollectionWithItems(
      { supabase: serviceSupabase },
      collectionId,
      user.id,
      limit
    )

    // Build response
    const response = {
      collection: {
        id: result.collection.id,
        name: result.collection.name,
        isDefaultFavorites: result.collection.is_default_favorites,
        itemCount: result.items.length,
        createdAt: result.collection.created_at
      },
      items: result.items.map((item: any) => {
        if (item.render) {
          return {
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
          }
        }
        return {
          type: 'community' as const,
          communityImageId: item.community_image_id,
          addedAt: item.added_at,
          imageUrl: item.image_url,
          thumbUrl: item.thumb_url,
          applySettings: item.apply_settings,
        }
      })
    }

    ctx?.logger?.info?.('collections.detail', { userId: user.id, collectionId, itemCount: response.items.length })
    return ok(response)

  } catch (error: any) {
    ctx?.logger?.error?.('collections.detail_error', { message: error?.message })
    
    if (error.message === 'Collection not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Collection not found or access denied')
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch collection')
  }
}

async function handlePATCH(req: NextRequest, ctx: Context & { logger?: any }) {
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
    const parsed = RenameCollectionSchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
    }

    const { name } = parsed.data

    // Get service client
    const serviceSupabase = createServiceSupabaseClient()

    // Rename collection
    await renameUserCollection(
      { supabase: serviceSupabase },
      collectionId,
      user.id,
      name
    )

    ctx?.logger?.info?.('collections.rename', { userId: user.id, collectionId })
    return ok({ message: 'Collection renamed successfully' })

  } catch (error: any) {
    ctx?.logger?.error?.('collections.rename_error', { message: error?.message })
    
    if (error.message === 'Collection not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Collection not found or access denied')
    }
    
    if (error.message === 'Cannot delete default favorites collection') {
      return fail(400, 'VALIDATION_ERROR', 'Cannot rename default favorites collection')
    }
    
    if (error.message === 'Collection name cannot be empty' || error.message === 'Collection name too long') {
      return fail(400, 'VALIDATION_ERROR', error.message)
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to rename collection')
  }
}

async function handleDELETE(req: NextRequest, ctx: Context & { logger?: any }) {
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

    // Get service client
    const serviceSupabase = createServiceSupabaseClient()

    // Delete collection
    await deleteUserCollection(
      { supabase: serviceSupabase },
      collectionId,
      user.id
    )

    ctx?.logger?.info?.('collections.delete', { userId: user.id, collectionId })
    return ok({ message: 'Collection deleted successfully' })

  } catch (error: any) {
    ctx?.logger?.error?.('collections.delete_error', { message: error?.message })
    
    if (error.message === 'Collection not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Collection not found or access denied')
    }
    
    if (error.message === 'Cannot delete default favorites collection') {
      return fail(400, 'VALIDATION_ERROR', 'Cannot delete default favorites collection')
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to delete collection')
  }
}

export const GET = withMethodsCtx(['GET'], withRequestContext(handleGET) as any)
export const PATCH = withMethodsCtx(['PATCH'], withRequestContext(handlePATCH) as any)
export const DELETE = withMethodsCtx(['DELETE'], withRequestContext(handleDELETE) as any)
