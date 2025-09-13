import { NextRequest } from 'next/server'
import { ok, fail } from '@/libs/api-utils/responses'
import { withMethodsCtx } from '@/libs/api-utils/methods'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { listPublishedItems } from '@/libs/services/community'
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic'

async function handleGET(_req: NextRequest, ctx: { params: { id: string }, logger?: any }) {
  try {
    const supabase = createServiceSupabaseClient()
    const data = await listPublishedItems({ supabase }, { collectionId: ctx.params.id })
    ctx?.logger?.info?.('community.collections.items', { collectionId: ctx.params.id, count: data?.length ?? 0 })
    return ok({ items: data })
  } catch (err: any) {
    ctx?.logger?.error?.('community.collections.items_error', { message: err?.message })
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
}

export const GET = withMethodsCtx(['GET'], withRequestContext(handleGET) as any)
