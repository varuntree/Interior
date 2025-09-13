import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { getCommunityCollectionsSummary } from '@/libs/services/community_collections'
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], withRequestContext(async (_req, ctx) => {
  try {
    const supabase = createServiceSupabaseClient()
    const collections = await getCommunityCollectionsSummary(supabase)
    ctx?.logger?.info?.('community.collections.summary', { count: collections?.length ?? 0 })
    return ok({ collections })
  } catch (err: any) {
    ctx?.logger?.error?.('community.collections.summary_error', { message: err?.message })
    return fail(500, 'INTERNAL_ERROR', 'Failed to load community collections')
  }
}))
