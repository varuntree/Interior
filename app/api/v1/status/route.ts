import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { ok } from '@/libs/api-utils/responses';
import { checkDbConnectivity } from '@/libs/services/health'

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient();
    const result = await checkDbConnectivity({ supabase })
    return ok(result);
  } catch (error) {
    return ok({
      supabase: 'error'
    });
  }
}
