import type { SupabaseClient } from '@supabase/supabase-js'

export async function getCreditsSummary(
  ctx: { supabase: SupabaseClient },
  args: { userId: string }
): Promise<{ remainingGenerations: number; planId: string }> {
  // Minimal placeholder; wire to usage + plans later.
  return { remainingGenerations: 0, planId: 'unknown' }
}

