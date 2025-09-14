// app/api/v1/renders/[id]/route.ts
import { NextRequest } from 'next/server'
import { ok, fail } from '@/libs/api-utils/responses'
import { withMethodsCtx } from '@/libs/api-utils/methods'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { createClient } from '@/libs/supabase/server'
import { deleteUserRender } from '@/libs/services/renders'
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic'

interface Context { params: { id: string } }

async function handleDELETE(req: NextRequest, ctx: Context & { logger?: any }) {
  try {
    const { id: renderId } = ctx.params

    // Get authenticated user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Validate render ID
    if (!renderId || typeof renderId !== 'string') {
      return fail(400, 'VALIDATION_ERROR', 'Invalid render ID')
    }

    // Get service client
    const serviceSupabase = createServiceSupabaseClient()

    // Delete render
    await deleteUserRender(
      { supabase: serviceSupabase },
      renderId,
      user.id
    )

    ctx?.logger?.info?.('renders.delete', { userId: user.id, renderId })
    return ok({ message: 'Render deleted successfully' })

  } catch (error: any) {
    ctx?.logger?.error?.('renders.delete_error', { message: error?.message })
    
    if (error.message === 'Render not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Render not found or access denied')
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to delete render')
  }
}

export const DELETE = withMethodsCtx(['DELETE'], withRequestContext(handleDELETE) as any)
