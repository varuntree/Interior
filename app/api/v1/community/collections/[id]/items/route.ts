import { withMethodsCtx } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { withRequestContext } from '@/libs/observability/request'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { listPublishedItems } from '@/libs/services/community'

export const dynamic = 'force-dynamic'

interface Ctx { params: { id: string } }

export const GET = withMethodsCtx(['GET'], withRequestContext(async (req: Request, ctx: Ctx & { logger?: any }) => {
  try {
    const { id } = ctx.params
    // For MVP we expose a single synthesized collection id 'community'
    if (id !== 'community') {
      return fail(404, 'NOT_FOUND', 'Collection not found')
    }
    const supabase = createServiceSupabaseClient()
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '24')
    // Use service wrapper (no repo import in routes). Cursor ignored in MVP.
    const rows = await listPublishedItems({ supabase }, { collectionId: id })
    const items = rows.slice(0, Math.max(1, Math.min(100, limit)))
    ctx?.logger?.info?.('community.collection_items', { id, count: items.length })
    return ok({ items, nextCursor: undefined })
  } catch (e: any) {
    ctx?.logger?.error?.('community.collection_items_error', { message: e?.message })
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch collection items')
  }
}) as any)
