import type { SupabaseClient } from '@supabase/supabase-js'

export async function checkDbConnectivity(ctx: { supabase: SupabaseClient }): Promise<{ supabase: 'ok' | 'error' }> {
  try {
    const { error } = await ctx.supabase.from('profiles').select('id').limit(1)
    return { supabase: error ? 'error' : 'ok' }
  } catch {
    return { supabase: 'error' }
  }
}

