import type { SupabaseClient } from '@supabase/supabase-js'

export interface Collection {
  id: string
  owner_id: string
  name: string
  is_default_favorites: boolean
  created_at: string
}

export interface CollectionItem {
  collection_id: string
  render_id: string
  added_at: string
}

export async function listCollections(
  supabase: SupabaseClient,
  ownerId: string
): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('owner_id', ownerId)
    .order('is_default_favorites', { ascending: false })
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * Optimized utility to fetch collections for a user along with item counts
 * for both render items and community items using only three queries:
 *   - collections (owned by user)
 *   - collection_items filtered by user's collection ids
 *   - collection_community_items filtered by user's collection ids
 * It then aggregates counts in-memory to avoid N+1 queries.
 */
export async function listCollectionsWithCounts(
  supabase: SupabaseClient,
  ownerId: string
): Promise<Array<Collection & { item_count: number }>> {
  const collections = await listCollections(supabase, ownerId)
  if (collections.length === 0) return []

  const ids = collections.map(c => c.id)

  // Fetch all render items for these collections (only collection_id column)
  const { data: renderRows, error: renderErr } = await supabase
    .from('collection_items')
    .select('collection_id')
    .in('collection_id', ids)
  if (renderErr) throw renderErr

  // Fetch all community items for these collections (only collection_id column)
  const { data: communityRows, error: commErr } = await supabase
    .from('collection_community_items')
    .select('collection_id')
    .in('collection_id', ids)
  if (commErr) throw commErr

  // Aggregate counts per collection id
  const renderCountMap = new Map<string, number>()
  for (const row of renderRows || []) {
    renderCountMap.set(row.collection_id, (renderCountMap.get(row.collection_id) || 0) + 1)
  }
  const communityCountMap = new Map<string, number>()
  for (const row of communityRows || []) {
    communityCountMap.set(row.collection_id, (communityCountMap.get(row.collection_id) || 0) + 1)
  }

  return collections.map(c => ({
    ...c,
    item_count: (renderCountMap.get(c.id) || 0) + (communityCountMap.get(c.id) || 0)
  }))
}

export async function getDefaultFavorites(
  supabase: SupabaseClient,
  ownerId: string
): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_default_favorites', true)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export async function createCollection(
  supabase: SupabaseClient,
  ownerId: string,
  name: string
): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .insert({
      owner_id: ownerId,
      name,
      is_default_favorites: false
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function renameCollection(
  supabase: SupabaseClient,
  id: string,
  ownerId: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('collections')
    .update({ name })
    .eq('id', id)
    .eq('owner_id', ownerId)
    .eq('is_default_favorites', false) // Can't rename default
  
  if (error) throw error
}

export async function deleteCollection(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
): Promise<void> {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId)
    .eq('is_default_favorites', false) // Can't delete default
  
  if (error) throw error
}

export async function addToCollection(
  supabase: SupabaseClient,
  collectionId: string,
  renderId: string
): Promise<void> {
  const { error } = await supabase
    .from('collection_items')
    .insert({
      collection_id: collectionId,
      render_id: renderId
    })
    .select() // Use select to handle duplicates gracefully
  
  // Ignore unique constraint violations (item already in collection)
  if (error && error.code !== '23505') throw error
}

export async function removeFromCollection(
  supabase: SupabaseClient,
  collectionId: string,
  renderId: string
): Promise<void> {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('render_id', renderId)
  
  if (error) throw error
}

// Community image items (new)
export async function addCommunityImageToCollection(
  supabase: SupabaseClient,
  collectionId: string,
  communityImageId: string
): Promise<void> {
  const { error } = await supabase
    .from('collection_community_items')
    .insert({ collection_id: collectionId, community_image_id: communityImageId })
    .select()
  if (error && error.code !== '23505') throw error
}

export async function removeCommunityImageFromCollection(
  supabase: SupabaseClient,
  collectionId: string,
  communityImageId: string
): Promise<void> {
  const { error } = await supabase
    .from('collection_community_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('community_image_id', communityImageId)
  if (error) throw error
}

export async function listCollectionItems(
  supabase: SupabaseClient,
  collectionId: string,
  limit = 50
): Promise<CollectionItem[]> {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data || []
}

export async function countCollectionItems(
  supabase: SupabaseClient,
  collectionId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('collection_items')
    .select('render_id', { count: 'exact', head: true })
    .eq('collection_id', collectionId)
  if (error) throw error
  return count || 0
}

export async function countCollectionCommunityItems(
  supabase: SupabaseClient,
  collectionId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('collection_community_items')
    .select('community_image_id', { count: 'exact', head: true })
    .eq('collection_id', collectionId)
  if (error) throw error
  return count || 0
}

export async function listCommunityItemsWithImage(
  supabase: SupabaseClient,
  collectionId: string,
  limit = 50
): Promise<Array<{ collection_id: string; community_image_id: string; added_at: string; community_image: {
  id: string; image_path?: string | null; thumb_path?: string | null; external_url?: string | null; apply_settings?: any; created_at: string;
} | null }>> {
  const { data, error } = await supabase
    .from('collection_community_items')
    .select(`
      collection_id,
      community_image_id,
      added_at,
      community_image:community_images!collection_community_items_community_image_id_fkey (
        id, image_path, thumb_path, external_url, apply_settings, created_at
      )
    `)
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []) as any
}

export async function getCollectionById(
  supabase: SupabaseClient,
  collectionId: string,
  ownerId: string
): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('owner_id', ownerId)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export async function getRenderById(
  supabase: SupabaseClient,
  renderId: string,
  ownerId: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('renders')
    .select('id')
    .eq('id', renderId)
    .eq('owner_id', ownerId)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export async function batchAddToCollection(
  supabase: SupabaseClient,
  collectionId: string,
  renderIds: string[]
): Promise<void> {
  const insertData = renderIds.map(renderId => ({
    collection_id: collectionId,
    render_id: renderId
  }))

  const { error } = await supabase
    .from('collection_items')
    .insert(insertData)
  
  if (error) throw error
}

export async function verifyRenderIds(
  supabase: SupabaseClient,
  renderIds: string[],
  ownerId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('renders')
    .select('id')
    .eq('owner_id', ownerId)
    .in('id', renderIds)
  
  if (error) throw error
  return data?.map(r => r.id) || []
}

/**
 * Returns a Set of render_ids that are present in the user's default
 * favorites collection for the provided renderIds. If the user does
 * not have a default favorites collection yet, returns an empty Set.
 */
export async function getFavoritesMembership(
  supabase: SupabaseClient,
  ownerId: string,
  renderIds: string[]
): Promise<Set<string>> {
  if (renderIds.length === 0) return new Set()

  // Find default favorites collection for this user
  const favorites = await getDefaultFavorites(supabase, ownerId)
  if (!favorites) return new Set()

  const { data, error } = await supabase
    .from('collection_items')
    .select('render_id')
    .eq('collection_id', favorites.id)
    .in('render_id', renderIds)

  if (error) throw error

  const set = new Set<string>()
  for (const row of data || []) {
    if (row.render_id) set.add(row.render_id)
  }
  return set
}
