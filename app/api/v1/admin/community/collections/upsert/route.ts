import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { upsertCollection } from '@/libs/services/community'
import { checkAdminStatus } from '@/libs/services/admin'

const BodySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  position: z.number().optional()
})

async function handlePOST(req: Request) {
  try {
    const body = await req.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
    }

    const supabase = createServiceSupabaseClient()
    
    // Check admin status
    const { isAdmin } = await checkAdminStatus({ supabase })
    if (!isAdmin) {
      return fail(403, 'FORBIDDEN', 'Admin access required')
    }

    const data = await upsertCollection({ supabase }, {
      id: parsed.data.id,
      title: parsed.data.title,
      description: parsed.data.description,
      coverImageUrl: parsed.data.coverImageUrl,
      position: parsed.data.position
    })
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
