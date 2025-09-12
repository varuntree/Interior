import type { SupabaseClient } from '@supabase/supabase-js'

export async function recordWebhookEventIfNew(
  supabase: SupabaseClient,
  provider: 'stripe' | 'replicate',
  eventId: string,
  payload?: any
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('webhook_events')
      .insert({ provider, event_id: eventId, payload })
    if (error) {
      // Unique violation → already processed
      if ((error as any).code === '23505' || /duplicate|unique/i.test(error.message)) {
        return false
      }
      throw error
    }
    return true
  } catch (err: any) {
    // In case insert without select doesn't surface code, attempt a select fallback
    try {
      const { data } = await supabase
        .from('webhook_events')
        .select('id')
        .eq('provider', provider)
        .eq('event_id', eventId)
        .maybeSingle()
      return !data ? true : false
    } catch {
      throw err
    }
  }
}

