import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { withRequestContext } from '@/libs/observability/request'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { getCommunityCollectionsSummary } from '@/libs/services/community_collections'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], withRequestContext(async (_req, ctx?: any) => {
  try {
    const supabase = createServiceSupabaseClient()
    const collections = await getCommunityCollectionsSummary(supabase)
    ctx?.logger?.info?.('community.collections', { count: collections.length })
    return ok({ collections })
  } catch (e: any) {
    ctx?.logger?.error?.('community.collections_error', { message: e?.message })
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch community collections')
  }
}))

