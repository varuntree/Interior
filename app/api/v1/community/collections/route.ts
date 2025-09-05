import { withMethods } from '@/libs/api-utils/handler'
import { ok } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { listPublishedCollections } from '@/libs/services/community'

async function handleGET(req: Request) {
  try {
    const supabase = createServiceSupabaseClient()
    const data = await listPublishedCollections({ supabase })
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