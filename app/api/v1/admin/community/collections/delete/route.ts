import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, badRequest, forbidden } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { deleteCollection } from '@/libs/services/community'
import { checkAdminStatus } from '@/libs/services/admin'

const BodySchema = z.object({
  id: z.string().min(1)
})

async function handlePOST(req: Request) {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Invalid request body')
    }

    const supabase = createServiceSupabaseClient()
    
    // Check admin status
    const { isAdmin } = await checkAdminStatus({ supabase })
    if (!isAdmin) {
      return forbidden('Admin access required')
    }

    const data = await deleteCollection({ supabase }, { id: parsed.data.id })
    return ok(data)
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: err?.message ?? 'Unexpected error' } },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    )
  }
}

export const POST = withMethods({
  POST: handlePOST
})