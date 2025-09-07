import type { SupabaseClient } from '@supabase/supabase-js'

export async function toggleFavorite(
  ctx: { supabase: SupabaseClient },
  args: { userId: string; generationId: string }
): Promise<{ isFavorite: boolean }> {
  // Placeholder; integrate with collections default favorites later.
  return { isFavorite: true }
}

export async function listFavorites(
  ctx: { supabase: SupabaseClient },
  args: { userId: string; cursor?: string; limit: number }
): Promise<{ items: any[]; nextCursor: string | null }> {
  // Placeholder list; replace with real query to favorites collection.
  return { items: [], nextCursor: null }
}

