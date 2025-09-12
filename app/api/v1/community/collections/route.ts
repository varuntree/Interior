import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { getCommunityCollectionsSummary } from '@/libs/services/community_collections'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], async () => {
  try {
    const supabase = createServiceSupabaseClient()
    const collections = await getCommunityCollectionsSummary(supabase)
    return ok({ collections })
  } catch (err) {
    return fail(500, 'INTERNAL_ERROR', 'Failed to load community collections')
  }
})
