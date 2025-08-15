import { NextRequest } from 'next/server';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { ok, fail } from '@/libs/api-utils/responses';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient();
    // Test with a simple query
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    return ok({
      supabase: error ? 'error' : 'ok'
    });
  } catch (error) {
    return ok({
      supabase: 'error'
    });
  }
}