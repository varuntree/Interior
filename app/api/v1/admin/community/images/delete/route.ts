import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { deleteImages } from '@/libs/services/community_images_admin'

export const dynamic = 'force-dynamic'

async function handlePOST(req: Request) {
  try {
    const supabase = createServiceSupabaseClient()
    const body = await req.json().catch(() => ({}))
    const ids: string[] = Array.isArray(body.ids) ? body.ids : []
    if (ids.length === 0) return fail(400, 'VALIDATION_ERROR', 'No ids provided')

    const result = await deleteImages({ supabase }, { ids })
    return ok(result)
  } catch (err: any) {
    if (err?.message === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Admin access required')
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Delete failed')
  }
}

export const POST = withMethods(['POST'], handlePOST as any)

