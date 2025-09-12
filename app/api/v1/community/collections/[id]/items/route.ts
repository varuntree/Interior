import { NextRequest } from 'next/server'
import { ok, fail } from '@/libs/api-utils/responses'
import { withMethodsCtx } from '@/libs/api-utils/methods'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { listPublishedItems } from '@/libs/services/community'

export const dynamic = 'force-dynamic'

async function handleGET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceSupabaseClient()
    const data = await listPublishedItems({ supabase }, { collectionId: params.id })
    return ok({ items: data })
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
}

export const GET = withMethodsCtx(['GET'], handleGET as any)
