import { withMethods } from '@/libs/api-utils/handler'
import { ok } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { listPublishedItems } from '@/libs/services/community'

async function handleGET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceSupabaseClient()
    const data = await listPublishedItems({ supabase }, { collectionId: params.id })
    return ok(data)
  } catch (err: any) {
    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: err?.message ?? 'Unexpected error' } },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
    )
  }
}

export const GET = withMethods({
  GET: handleGET
})