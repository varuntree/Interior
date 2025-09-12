import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { env } from '@/libs/env'

async function handlePOST() {
  try {
    const supabase = createServiceSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const allow = (env.server.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const isAdmin = user.email ? allow.includes(user.email.toLowerCase()) : false

    return ok({ isAdmin })
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
}

export const dynamic = 'force-dynamic'

export const POST = withMethods(['POST'], handlePOST as any)
