import type { SupabaseClient } from '@supabase/supabase-js'
import * as collectionsRepo from '@/libs/repositories/collections'
import * as rendersRepo from '@/libs/repositories/renders'

export interface CollectionWithCount {
  id: string
  owner_id: string
  name: string
  is_default_favorites: boolean
  created_at: string
  item_count: number
}

export interface CollectionItemWithRender {
  collection_id: string
  render_id: string
  added_at: string
  render: {
    id: string
    mode: string
    room_type?: string
    style?: string
    cover_variant: number
    created_at: string
    cover_image_url?: string
  }
}

export async function ensureDefaultFavorites(
  ctx: { supabase: SupabaseClient },
  ownerId: string
): Promise<collectionsRepo.Collection> {
  const existing = await collectionsRepo.getDefaultFavorites(ctx.supabase, ownerId)
  
  if (existing) {
    return existing
  }

  // Create default favorites if it doesn't exist
  return await collectionsRepo.createCollection(ctx.supabase, ownerId, 'My Favorites')
}

export async function listUserCollections(
  ctx: { supabase: SupabaseClient },
  ownerId: string
): Promise<CollectionWithCount[]> {
  const collections = await collectionsRepo.listCollections(ctx.supabase, ownerId)
  // Count both render items and community image items per collection
  const withCounts = await Promise.all(collections.map(async (c) => {
    const [renderCount, communityCount] = await Promise.all([
      collectionsRepo.countCollectionItems(ctx.supabase, c.id).catch(() => 0),
      collectionsRepo.countCollectionCommunityItems(ctx.supabase, c.id).catch(() => 0),
    ])
    return { ...c, item_count: renderCount + communityCount }
  }))
  return withCounts
}

export async function createUserCollection(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  name: string
): Promise<collectionsRepo.Collection> {
  // Validate name
  if (!name || name.trim().length === 0) {
    throw new Error('Collection name cannot be empty')
  }
  
  if (name.trim().length > 100) {
    throw new Error('Collection name too long')
  }
  
  return await collectionsRepo.createCollection(ctx.supabase, ownerId, name.trim())
}

export async function renameUserCollection(
  ctx: { supabase: SupabaseClient },
  collectionId: string,
  ownerId: string,
  newName: string
): Promise<void> {
  // Validate name
  if (!newName || newName.trim().length === 0) {
    throw new Error('Collection name cannot be empty')
  }
  
  if (newName.trim().length > 100) {
    throw new Error('Collection name too long')
  }
  
  await collectionsRepo.renameCollection(ctx.supabase, collectionId, ownerId, newName.trim())
}

export async function deleteUserCollection(
  ctx: { supabase: SupabaseClient },
  collectionId: string,
  ownerId: string
): Promise<void> {
  // Additional check to prevent deleting default favorites
  const collection = await collectionsRepo.getCollectionById(ctx.supabase, collectionId, ownerId)
  
  if (!collection) {
    throw new Error('Collection not found or access denied')
  }
  
  if (collection.is_default_favorites) {
    throw new Error('Cannot delete default favorites collection')
  }
  
  await collectionsRepo.deleteCollection(ctx.supabase, collectionId, ownerId)
}

export async function addToFavorites(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  renderId: string
): Promise<void> {
  // Ensure default favorites exists
  const favorites = await ensureDefaultFavorites(ctx, ownerId)
  
  // Add to favorites (idempotent)
  await collectionsRepo.addToCollection(ctx.supabase, favorites.id, renderId)
}

export async function addCommunityToFavorites(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  communityImageId: string
): Promise<void> {
  const favorites = await ensureDefaultFavorites(ctx, ownerId)
  await collectionsRepo.addCommunityImageToCollection(ctx.supabase, favorites.id, communityImageId)
}

export async function addRenderToCollection(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  collectionId: string,
  renderId: string
): Promise<void> {
  // Verify collection ownership
  const collection = await collectionsRepo.getCollectionById(ctx.supabase, collectionId, ownerId)
  
  if (!collection) {
    throw new Error('Collection not found or access denied')
  }
  
  // Verify render ownership
  const render = await collectionsRepo.getRenderById(ctx.supabase, renderId, ownerId)
  
  if (!render) {
    throw new Error('Render not found or access denied')
  }
  
  await collectionsRepo.addToCollection(ctx.supabase, collectionId, renderId)
}

export async function addCommunityImageToCollection(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  collectionId: string,
  communityImageId: string
): Promise<void> {
  const collection = await collectionsRepo.getCollectionById(ctx.supabase, collectionId, ownerId)
  if (!collection) throw new Error('Collection not found or access denied')
  await collectionsRepo.addCommunityImageToCollection(ctx.supabase, collectionId, communityImageId)
}

export async function removeRenderFromCollection(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  collectionId: string,
  renderId: string
): Promise<void> {
  // Verify collection ownership
  const collection = await collectionsRepo.getCollectionById(ctx.supabase, collectionId, ownerId)
  
  if (!collection) {
    throw new Error('Collection not found or access denied')
  }
  
  await collectionsRepo.removeFromCollection(ctx.supabase, collectionId, renderId)
}

export async function getCollectionWithItems(
  ctx: { supabase: SupabaseClient },
  collectionId: string,
  ownerId: string,
  limit = 50
): Promise<{
  collection: collectionsRepo.Collection
  items: Array<CollectionItemWithRender | {
    type: 'community'
    collection_id: string
    community_image_id: string
    added_at: string
    image_url: string
    thumb_url?: string
    apply_settings?: any
  }>
}> {
  // Get collection and verify ownership
  const collection = await collectionsRepo.getCollectionById(ctx.supabase, collectionId, ownerId)
  
  if (!collection) {
    throw new Error('Collection not found or access denied')
  }
  
  // Get render items with render details (basic fields)
  const { data: items, error } = await ctx.supabase
    .from('collection_items')
    .select(`
      collection_id,
      render_id,
      added_at,
      renders:render_id (
        id,
        mode,
        room_type,
        style,
        cover_variant,
        created_at
      )
    `)
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  // Batch fetch variants for all renders to avoid N+1
  const renderIds = (items || []).map((it: any) => (Array.isArray(it.renders) ? it.renders[0]?.id : it.renders?.id)).filter(Boolean)
  const allVariants = await rendersRepo.getVariantsByRenderIds(ctx.supabase, renderIds)
  const variantsByRender = new Map<string, rendersRepo.RenderVariant[]>()
  for (const v of allVariants) {
    const arr = variantsByRender.get(v.render_id) || []
    arr.push(v)
    variantsByRender.set(v.render_id, arr)
  }

  // Format the response (with cover image url using public bucket)
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const renderFormatted: CollectionItemWithRender[] = (items || []).map((item: any) => {
    const renderData = Array.isArray(item.renders) ? item.renders[0] : item.renders
    const variants = variantsByRender.get(renderData.id) || []
    const cover = variants.find(v => v.idx === renderData.cover_variant)
    const coverUrl = cover ? `${base}/storage/v1/object/public/public/${cover.image_path}` : undefined
    return {
      collection_id: item.collection_id,
      render_id: item.render_id,
      added_at: item.added_at,
      render: {
        id: renderData.id,
        mode: renderData.mode,
        room_type: renderData.room_type,
        style: renderData.style,
        cover_variant: renderData.cover_variant,
        created_at: renderData.created_at,
        cover_image_url: coverUrl,
      }
    }
  })
  // Community image items
  const commRows = await collectionsRepo.listCommunityItemsWithImage(ctx.supabase, collectionId, limit)
  const communityFormatted = commRows.map(row => {
    const img = row.community_image
    const imageUrl = img?.external_url || (img?.image_path ? `${base}/storage/v1/object/public/public/${img.image_path}` : '')
    const thumbUrl = img?.thumb_path ? `${base}/storage/v1/object/public/public/${img.thumb_path}` : undefined
    return {
      type: 'community' as const,
      collection_id: row.collection_id,
      community_image_id: row.community_image_id,
      added_at: row.added_at,
      image_url: imageUrl,
      thumb_url: thumbUrl,
      apply_settings: img?.apply_settings ?? undefined,
    }
  })

  // Merge and sort by added_at desc; limit
  const merged = [
    ...renderFormatted,
    ...communityFormatted,
  ].sort((a: any, b: any) => (new Date(b.added_at).getTime() - new Date(a.added_at).getTime()))
   .slice(0, limit)
  
  return {
    collection,
    items: merged
  }
}

export async function batchAddToCollection(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  collectionId: string,
  renderIds: string[]
): Promise<void> {
  if (renderIds.length === 0) return
  
  // Verify collection ownership
  const collection = await collectionsRepo.getCollectionById(ctx.supabase, collectionId, ownerId)
  
  if (!collection) {
    throw new Error('Collection not found or access denied')
  }
  
  // Verify all renders belong to the user
  const verifiedRenderIds = await collectionsRepo.verifyRenderIds(ctx.supabase, renderIds, ownerId)
  
  if (verifiedRenderIds.length !== renderIds.length) {
    throw new Error('Some renders not found or access denied')
  }
  
  // Batch insert (ignore duplicates)
  await collectionsRepo.batchAddToCollection(ctx.supabase, collectionId, verifiedRenderIds)
}

export async function removeCommunityImageFromCollection(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  collectionId: string,
  communityImageId: string
): Promise<void> {
  const collection = await collectionsRepo.getCollectionById(ctx.supabase, collectionId, ownerId)
  if (!collection) throw new Error('Collection not found or access denied')
  await collectionsRepo.removeCommunityImageFromCollection(ctx.supabase, collectionId, communityImageId)
}

// Minimal upsert for API compatibility
export async function upsertCollection(
  ctx: { supabase: SupabaseClient },
  args: { userId: string; id?: string; title: string }
): Promise<{ id?: string; title: string }> {
  if (args.id) {
    await renameUserCollection(ctx, args.id, args.userId, args.title)
    return { id: args.id, title: args.title }
  } else {
    const created = await createUserCollection(ctx, args.userId, args.title)
    return { id: created.id, title: created.name }
  }
}

// Minimal toggle for API compatibility (no-op placeholder)
export async function toggleCollectionItem(
  ctx: { supabase: SupabaseClient },
  args: { userId: string; collectionId: string; generationId: string }
): Promise<{ toggled: boolean }> {
  // TODO: map generationId→renderId and add/remove from collection
  return { toggled: true }
}
