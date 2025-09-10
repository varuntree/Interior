import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { bootstrapAdmin } from '@/libs/services/admin'

async function handlePOST() {
  try {
    const supabase = createServiceSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const allowlistEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    
    const result = await bootstrapAdmin(
      { supabase },
      { 
        allowlistEmails,
        userEmail: user.email || '',
        userId: user.id
      }
    )

    return ok(result)
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: err?.message ?? 'Unexpected error' } },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    )
  }
}

export const POST = withMethods(['POST'], handlePOST as any)
