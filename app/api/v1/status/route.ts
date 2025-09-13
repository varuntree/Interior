import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { ok, fail } from '@/libs/api-utils/responses';
import { withMethods } from '@/libs/api-utils/methods'
import { checkDbConnectivity } from '@/libs/services/health'
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], withRequestContext(async (_req, ctx) => {
  try {
    const supabase = createServiceSupabaseClient();
    const result = await checkDbConnectivity({ supabase })
    ctx?.logger.info('status.ok', result)
    return ok(result);
  } catch (error: any) {
    ctx?.logger.error('status.error', { message: error?.message })
    return fail(503, 'SERVICE_UNAVAILABLE', 'Database connectivity issue')
  }
}))
