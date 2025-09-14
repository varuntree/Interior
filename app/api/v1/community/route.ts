// app/api/v1/community/route.ts
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { CACHE_CONFIGS } from '@/libs/api-utils/cache'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { listCommunityFlat } from '@/libs/services/community'
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], withRequestContext(async (req: NextRequest, ctx) => {
  try {
    // Parse query parameters (flat list only)
    const url = new URL(req.url)
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '24')))
    const cursor = url.searchParams.get('cursor')

    // Get service client (no auth required for community endpoint)
    const serviceSupabase = createServiceSupabaseClient()

    const { items, nextCursor } = await listCommunityFlat({ supabase: serviceSupabase }, { limit, cursor })
    const response = { items, nextCursor }

    ctx?.logger?.info?.('community.list', { count: items.length, hasNext: !!nextCursor })
    return ok(response, undefined, CACHE_CONFIGS.PUBLIC)

  } catch (error: any) {
    ctx?.logger?.error?.('community.list_error', { message: error?.message })
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch community content')
  }
}))
