// app/api/v1/collections/[id]/community-items/[communityImageId]/route.ts
import { NextRequest } from 'next/server'
import { ok, fail } from '@/libs/api-utils/responses'
import { withMethodsCtx } from '@/libs/api-utils/methods'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { createClient } from '@/libs/supabase/server'
import { removeCommunityImageFromCollection } from '@/libs/services/collections'
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic'

interface Context {
  params: { 
    id: string
    communityImageId: string 
  }
}

async function handleDELETE(_req: NextRequest, ctx: Context & { logger?: any }) {
  try {
    const { id: collectionId, communityImageId } = ctx.params

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fail(401, 'UNAUTHORIZED', 'Authentication required')

    if (!collectionId || !communityImageId) return fail(400, 'VALIDATION_ERROR', 'Invalid IDs')

    const serviceSupabase = createServiceSupabaseClient()
    await removeCommunityImageFromCollection({ supabase: serviceSupabase }, user.id, collectionId, communityImageId)

    ctx?.logger?.info?.('collections.community_items.remove', { userId: user.id, collectionId, communityImageId })
    return ok({ message: 'Image removed from collection successfully' })
  } catch (error: any) {
    ctx?.logger?.error?.('collections.community_items.remove_error', { message: error?.message })
    return fail(500, 'INTERNAL_ERROR', 'Failed to remove image from collection')
  }
}

export const DELETE = withMethodsCtx(['DELETE'], withRequestContext(handleDELETE) as any)

