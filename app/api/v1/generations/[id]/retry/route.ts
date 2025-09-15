// app/api/v1/generations/[id]/retry/route.ts
import { NextRequest } from 'next/server'
import { withMethodsCtx } from '@/libs/api-utils/methods'
import { accepted, fail } from '@/libs/api-utils/responses'
import { withRequestContext } from '@/libs/observability/request'
import { createClient } from '@/libs/supabase/server'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { cloneAndRetry } from '@/libs/services/generation'
import { getWebhookBaseUrl } from '@/libs/api-utils/url-validation'

export const dynamic = 'force-dynamic'

export const POST = withMethodsCtx(['POST'], withRequestContext(async (req: NextRequest, ctx: { params: { id: string }; logger?: any }) => {
  try {
    const { id: jobId } = ctx.params
    const supabaseSSR = createClient()
    const { data: { user } } = await supabaseSSR.auth.getUser()
    if (!user) return fail(401, 'UNAUTHORIZED', 'Authentication required')

    const baseUrl = getWebhookBaseUrl(req)
    const serviceSupabase = createServiceSupabaseClient()
    const result = await cloneAndRetry({ supabase: serviceSupabase, userId: user.id, baseUrl }, jobId)
    ctx?.logger?.info?.('generation.retry_request', { userId: user.id, jobId, newJobId: result.id })
    return accepted(result)
  } catch (error: any) {
    ctx?.logger?.error?.('generation.retry_error', { message: error?.message })
    if (error?.message === 'NOT_FOUND') return fail(404, 'NOT_FOUND', 'Generation not found')
    if (error?.message === 'INVALID_STATE') return fail(400, 'VALIDATION_ERROR', 'Only failed generations can be retried')
    if (error?.message === 'TOO_MANY_INFLIGHT') return fail(409, 'TOO_MANY_INFLIGHT', 'Please wait until your current generation is complete.')
    if (error?.message?.includes('CONFIGURATION_ERROR')) return fail(500, 'CONFIGURATION_ERROR', error?.message)
    return fail(500, 'INTERNAL_ERROR', 'Failed to retry generation')
  }
}))
