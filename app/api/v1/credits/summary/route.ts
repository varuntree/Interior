import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { getCreditsSummary } from '@/libs/services/credits'

export const GET = withMethods({
  GET: async () => {
    try {
      const supabase = createServiceSupabaseClient()
      
      // Get current user from session
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return fail(401, 'UNAUTHORIZED', 'Authentication required')
      }

      const summary = await getCreditsSummary({ supabase }, { userId: user.id })

      return ok(summary)
    } catch (err: any) {
      return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
    }
  }
})
