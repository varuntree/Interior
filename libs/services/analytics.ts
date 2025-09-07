import type { SupabaseClient } from '@supabase/supabase-js'

export async function logEvent(
  ctx: { supabase: SupabaseClient },
  args: { userId?: string | null; type: 'page' | 'generation_submit' | 'generation_done' | 'error'; payload?: any }
): Promise<void> {
  const { supabase } = ctx
  const { error } = await supabase
    .from('logs_analytics')
    .insert({
      owner_id: args.userId ?? null,
      type: args.type,
      payload: args.payload ?? null
    })
  if (error) throw error
}

