// app/api/v1/renders/[id]/route.ts
import { NextRequest } from 'next/server'
import { ok, fail } from '@/libs/api-utils/responses'
import { withMethodsCtx } from '@/libs/api-utils/methods'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { createClient } from '@/libs/supabase/server'
import { getRenderDetails, deleteUserRender } from '@/libs/services/renders'
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic'

interface Context { params: { id: string } }

async function handleGET(req: NextRequest, ctx: Context & { logger?: any }) {
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

    // Get render details
    const render = await getRenderDetails(
      { supabase: serviceSupabase },
      renderId,
      user.id
    )

    if (!render) {
      return fail(404, 'NOT_FOUND', 'Render not found or access denied')
    }

    // Build response
    const response = {
      id: render.id,
      jobId: render.job_id,
      mode: render.mode,
      roomType: render.room_type,
      style: render.style,
      coverVariant: render.cover_variant,
      createdAt: render.created_at,
      variants: render.variants.map(variant => ({
        id: variant.id,
        index: variant.idx,
        imageUrl: variant.image_url,
        thumbUrl: variant.thumb_url,
        imagePath: variant.image_path,
        createdAt: variant.created_at
      }))
    }

    ctx?.logger?.info?.('renders.detail', { userId: user.id, renderId })
    return ok(response)

  } catch (error: any) {
    ctx?.logger?.error?.('renders.detail_error', { message: error?.message })
    
    if (error.message === 'Render not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Render not found or access denied')
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch render details')
  }
}

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

export const GET = withMethodsCtx(['GET'], withRequestContext(handleGET) as any)
export const DELETE = withMethodsCtx(['DELETE'], withRequestContext(handleDELETE) as any)

async function handlePATCH(req: NextRequest, ctx: Context & { logger?: any }) {
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

    // Parse request body
    const body = await req.json()
    
    // For MVP, only support updating cover variant
    if (body.coverVariant !== undefined) {
      const serviceSupabase = createServiceSupabaseClient()
      const { updateRenderCover } = await import('@/libs/services/renders')
      
      await updateRenderCover(
        { supabase: serviceSupabase },
        renderId,
        user.id,
        body.coverVariant
      )

      ctx?.logger?.info?.('renders.update_cover', { userId: user.id, renderId, coverVariant: body.coverVariant })
      return ok({ message: 'Cover variant updated successfully' })
    }

    return fail(400, 'VALIDATION_ERROR', 'No valid updates provided')

  } catch (error: any) {
    ctx?.logger?.error?.('renders.update_error', { message: error?.message })
    
    if (error.message === 'Render not found or access denied' || error.message === 'Variant not found or access denied') {
      return fail(404, 'NOT_FOUND', 'Render or variant not found or access denied')
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to update render')
  }
}

export const PATCH = withMethodsCtx(['PATCH'], withRequestContext(handlePATCH) as any)
