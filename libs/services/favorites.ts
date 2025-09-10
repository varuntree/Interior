import type { SupabaseClient } from '@supabase/supabase-js'
import * as collectionsRepo from '@/libs/repositories/collections'

// Toggle favorite for a render using the default favorites collection
export async function toggleFavorite(
  ctx: { supabase: SupabaseClient },
  args: { userId: string; generationId: string }
): Promise<{ isFavorite: boolean }> {
  const { supabase } = ctx
  const { userId, generationId } = args

  // Treat generationId as renderId
  const renderId = generationId

  // Ensure default favorites exists
  let favorites = await collectionsRepo.getDefaultFavorites(supabase, userId)
  if (!favorites) {
    favorites = await collectionsRepo.createCollection(supabase, userId, 'My Favorites')
  }

  // Check if item already in favorites
  const { data: existing, error } = await supabase
    .from('collection_items')
    .select('render_id')
    .eq('collection_id', favorites.id)
    .eq('render_id', renderId)
    .maybeSingle()
  if (error) throw error

  if (existing) {
    // Remove from favorites
    await collectionsRepo.removeFromCollection(supabase, favorites.id, renderId)
    return { isFavorite: false }
  } else {
    // Add to favorites
    await collectionsRepo.addToCollection(supabase, favorites.id, renderId)
    return { isFavorite: true }
  }
}

// List favorites items
export async function listFavorites(
  ctx: { supabase: SupabaseClient },
  args: { userId: string; cursor?: string; limit: number }
): Promise<{ items: Array<{ renderId: string; coverImageUrl?: string; addedAt: string }>; nextCursor: string | null }> {
  const { supabase } = ctx
  const { userId, cursor, limit } = args

  const favorites = await collectionsRepo.getDefaultFavorites(supabase, userId)
  if (!favorites) {
    return { items: [], nextCursor: null }
  }

  // Simple list by added_at desc; apply cursor as added_at lt
  let query = supabase
    .from('collection_items')
    .select('render_id, added_at')
    .eq('collection_id', favorites.id)
    .order('added_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) query = query.lt('added_at', cursor)

  const { data, error } = await query
  if (error) throw error

  const hasMore = (data?.length || 0) > limit
  const slice = hasMore ? data!.slice(0, -1) : (data || [])

  // Resolve cover image URL per render
  const items: Array<{ renderId: string; coverImageUrl?: string; addedAt: string }> = []
  for (const item of slice) {
    let coverUrl: string | undefined
    try {
      const { data: renderRow } = await supabase
        .from('renders')
        .select('id, cover_variant')
        .eq('id', item.render_id)
        .maybeSingle()
      if (renderRow) {
        const { data: variant } = await supabase
          .from('render_variants')
          .select('image_path')
          .eq('render_id', renderRow.id)
          .eq('idx', renderRow.cover_variant)
          .maybeSingle()
        if (variant?.image_path) {
          const base = process.env.NEXT_PUBLIC_SUPABASE_URL
          coverUrl = `${base}/storage/v1/object/public/public/${variant.image_path}`
        }
      }
    } catch {}
    items.push({ renderId: item.render_id, coverImageUrl: coverUrl, addedAt: item.added_at })
  }

  const nextCursor = hasMore ? items[items.length - 1].addedAt : null
  return { items, nextCursor }
}
