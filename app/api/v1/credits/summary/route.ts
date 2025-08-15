import { withMethods } from '@/libs/api-utils/handler'
import { ok, unauthorized, serverError } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { getCreditsSummary } from '@/libs/services/credits'

export const GET = withMethods({
  GET: async () => {
    try {
      const supabase = createServiceSupabaseClient()
      
      // Get current user from session
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return unauthorized('Authentication required')
      }

      const summary = await getCreditsSummary({ supabase }, { userId: user.id })

      return ok(summary)
    } catch (err: any) {
      return serverError(err?.message ?? 'Unexpected error')
    }
  }
})