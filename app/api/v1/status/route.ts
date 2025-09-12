import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { ok } from '@/libs/api-utils/responses';
import { withMethods } from '@/libs/api-utils/methods'
import { checkDbConnectivity } from '@/libs/services/health'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], async () => {
  try {
    const supabase = createServiceSupabaseClient();
    const result = await checkDbConnectivity({ supabase })
    return ok(result);
  } catch (error) {
    return ok({ supabase: 'error' });
  }
})
