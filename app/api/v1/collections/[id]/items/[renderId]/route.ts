// app/api/v1/collections/[id]/items/[renderId]/route.ts
import { NextRequest } from 'next/server'
import { ok, fail } from '@/libs/api-utils/responses'
import { withMethodsCtx } from '@/libs/api-utils/methods'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { createClient } from '@/libs/supabase/server'
import { removeRenderFromCollection } from '@/libs/services/collections'

export const dynamic = 'force-dynamic'

interface Context {
  params: { 
    id: string
    renderId: string 
  }
}

async function handleDELETE(req: NextRequest, { params }: Context) {
  try {
    const { id: collectionId, renderId } = params

    // Get authenticated user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Validate IDs
    if (!collectionId || typeof collectionId !== 'string') {
      return fail(400, 'VALIDATION_ERROR', 'Invalid collection ID')
    }
    
    if (!renderId || typeof renderId !== 'string') {
      return fail(400, 'VALIDATION_ERROR', 'Invalid render ID')
    }

    // Get service client
    const serviceSupabase = createServiceSupabaseClient()

    // Remove render from collection
    await removeRenderFromCollection(
      { supabase: serviceSupabase },
      user.id,
      collectionId,
      renderId
    )

    return ok({ message: 'Render removed from collection successfully' })

  } catch (error: any) {
    console.error('Remove from collection error:', error)
    
    if (error.message === 'Collection not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Collection not found or access denied')
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to remove render from collection')
  }
}

export const DELETE = withMethodsCtx(['DELETE'], handleDELETE as any)
