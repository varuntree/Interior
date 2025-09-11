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
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: err?.message ?? 'Unexpected error' } },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    )
  }
}

export const POST = withMethods(['POST'], handlePOST as any)
