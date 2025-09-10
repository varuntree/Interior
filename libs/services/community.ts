import type { SupabaseClient } from '@supabase/supabase-js'
import * as communityRepo from '@/libs/repositories/community'
import * as rendersRepo from '@/libs/repositories/renders'

export interface CommunityCollectionForUI {
  id: string
  title: string
  description?: string
  is_featured: boolean
  order_index: number
  created_at: string
  items: CommunityItemForUI[]
}

export interface CommunityItemForUI {
  id: string
  collection_id: string
  order_index: number
  created_at: string
  image_url: string
  thumb_url?: string
  apply_settings?: GenerationSettings
  source_type: 'internal' | 'external'
  render_id?: string
}

export interface GenerationSettings {
  mode?: string
  roomType?: string
  style?: string
  prompt?: string
}

export async function getCommunityGallery(
  ctx: { supabase: SupabaseClient },
  featuredOnly = false,
  itemsPerCollection = 10
): Promise<CommunityCollectionForUI[]> {
  const collectionsWithItems = await communityRepo.getAllCommunityCollectionsWithItems(
    ctx.supabase,
    featuredOnly,
    itemsPerCollection
  )

  const result: CommunityCollectionForUI[] = []
  for (const { collection, items } of collectionsWithItems) {
    const baseItems = items.map(formatCommunityItemForUI)
    const hydrated: CommunityItemForUI[] = []
    for (let i = 0; i < baseItems.length; i++) {
      hydrated.push(await hydrateCommunityItemUrls(ctx.supabase, baseItems[i], items[i]))
    }
    result.push({
      id: collection.id,
      title: collection.title,
      description: collection.description,
      is_featured: collection.is_featured,
      order_index: collection.order_index,
      created_at: collection.created_at,
      items: hydrated,
    })
  }
  return result
}

export async function getCommunityCollectionDetails(
  ctx: { supabase: SupabaseClient },
  collectionId: string
): Promise<CommunityCollectionForUI | null> {
  const result = await communityRepo.getCommunityCollectionWithItems(ctx.supabase, collectionId)
  
  if (!result) {
    return null
  }

  const { collection, items } = result
  const base = items.map(formatCommunityItemForUI)
  const hydrated: CommunityItemForUI[] = []
  for (let i = 0; i < base.length; i++) {
    hydrated.push(await hydrateCommunityItemUrls(ctx.supabase, base[i], items[i]))
  }

  return {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    is_featured: collection.is_featured,
    order_index: collection.order_index,
    created_at: collection.created_at,
    items: hydrated
  }
}

export function formatCommunityItemForUI(item: communityRepo.CommunityItemWithRender): CommunityItemForUI {
  if (item.render_id && item.render) {
    return {
      id: item.id,
      collection_id: item.collection_id,
      order_index: item.order_index,
      created_at: item.created_at,
      image_url: '', // hydrated later
      thumb_url: undefined,
      apply_settings: item.apply_settings,
      source_type: 'internal',
      render_id: item.render_id
    }
  }

  // External or fallback
  const url = item.external_image_url || '/placeholder-image.jpg'
  return {
    id: item.id,
    collection_id: item.collection_id,
    order_index: item.order_index,
    created_at: item.created_at,
    image_url: url,
    thumb_url: item.external_image_url || undefined,
    apply_settings: item.apply_settings,
    source_type: 'external',
    render_id: item.render_id
  }
}

function buildPublicUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/${path}`
}

async function hydrateCommunityItemUrls(
  supabase: SupabaseClient,
  item: CommunityItemForUI,
  raw: communityRepo.CommunityItemWithRender
): Promise<CommunityItemForUI> {
  if (item.source_type === 'internal' && raw.render_id && raw.render) {
    try {
      const variant = await rendersRepo.findVariantByRenderAndIdx(supabase, raw.render_id, raw.render.cover_variant)
      if (variant) {
        item.image_url = buildPublicUrl(variant.image_path)
        if (variant.thumb_path) item.thumb_url = buildPublicUrl(variant.thumb_path)
      } else {
        item.image_url = '/placeholder-image.jpg'
      }
    } catch {
      item.image_url = '/placeholder-image.jpg'
    }
  }
  return item
}

export function extractApplySettings(item: CommunityItemForUI): GenerationSettings {
  if (!item.apply_settings) {
    return {}
  }

  // Ensure we return a clean settings object
  const settings: GenerationSettings = {}

  if (item.apply_settings.mode) settings.mode = item.apply_settings.mode
  if (item.apply_settings.roomType) settings.roomType = item.apply_settings.roomType
  if (item.apply_settings.style) settings.style = item.apply_settings.style
  if (item.apply_settings.prompt) settings.prompt = item.apply_settings.prompt
  // Ignore legacy fields (aspectRatio, quality, variants) for UI prefill

  return settings
}

export async function searchCommunityContent(
  ctx: { supabase: SupabaseClient },
  query: string,
  limit = 20
): Promise<CommunityItemForUI[]> {
  const items = await communityRepo.searchCommunityItems(ctx.supabase, query, limit)
  
  return items.map(formatCommunityItemForUI)
}

export async function getFeaturedCollections(
  ctx: { supabase: SupabaseClient },
  itemsPerCollection = 6
): Promise<CommunityCollectionForUI[]> {
  return await getCommunityGallery(ctx, true, itemsPerCollection)
}

// Public read helpers for API routes
export async function listPublishedCollections(
  ctx: { supabase: SupabaseClient }
): Promise<communityRepo.CommunityCollection[]> {
  // Treat published as featured for MVP; return featured-only
  return communityRepo.listCommunityCollections(ctx.supabase, true)
}

export async function listPublishedItems(
  ctx: { supabase: SupabaseClient },
  args: { collectionId: string }
): Promise<communityRepo.CommunityItemWithRender[]> {
  return communityRepo.listCommunityItems(ctx.supabase, args.collectionId)
}

export async function getInspiration(
  ctx: { supabase: SupabaseClient },
  style?: string,
  roomType?: string,
  limit = 20
): Promise<CommunityItemForUI[]> {
  // Build search query based on filters
  let searchTerms: string[] = []
  
  if (style) searchTerms.push(style)
  if (roomType) searchTerms.push(roomType)
  
  const query = searchTerms.join(' ')
  
  if (query) {
    return await searchCommunityContent(ctx, query, limit)
  }

  // If no filters, get items from featured collections
  const featuredCollections = await getFeaturedCollections(ctx, limit)
  
  // Flatten items from all featured collections
  const allItems = featuredCollections.flatMap(collection => collection.items)
  
  // Shuffle and limit
  const shuffled = allItems.sort(() => Math.random() - 0.5)
  
  return shuffled.slice(0, limit)
}

// Helper function to validate apply_settings format
export function validateApplySettings(settings: any): GenerationSettings | null {
  if (!settings || typeof settings !== 'object') {
    return null
  }

  const validSettings: GenerationSettings = {}

  // Validate mode
  if (settings.mode && typeof settings.mode === 'string') {
    const validModes = ['redesign', 'staging', 'compose', 'imagine']
    if (validModes.includes(settings.mode)) {
      validSettings.mode = settings.mode
    }
  }

  // Validate other string fields
  const stringFields = ['roomType', 'style', 'prompt']
  stringFields.forEach(field => {
    if (settings[field] && typeof settings[field] === 'string') {
      (validSettings as any)[field] = settings[field]
    }
  })

  // variants ignored in new model

  return Object.keys(validSettings).length > 0 ? validSettings : null
}

// Helper to format settings for URL parameters or form prefill
export function settingsToUrlParams(settings: GenerationSettings): URLSearchParams {
  const params = new URLSearchParams()
  
  Object.entries(settings).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value))
    }
  })
  
  return params
}

// Helper to parse URL parameters back to settings
export function urlParamsToSettings(params: URLSearchParams): GenerationSettings {
  const settings: GenerationSettings = {}
  
  const mode = params.get('mode')
  if (mode) settings.mode = mode
  
  const roomType = params.get('roomType')
  if (roomType) settings.roomType = roomType
  
  const style = params.get('style')
  if (style) settings.style = style
  
  const prompt = params.get('prompt')
  if (prompt) settings.prompt = prompt
  
  // Ignore legacy aspectRatio/quality/variants
  
  return settings
}

// Admin functions for future admin interface
export async function createCommunityCollection(
  ctx: { supabase: SupabaseClient },
  title: string,
  description?: string,
  isFeatured = false,
  orderIndex = 0
): Promise<communityRepo.CommunityCollection> {
  return await communityRepo.createCommunityCollection(ctx.supabase, {
    title,
    description,
    is_featured: isFeatured,
    order_index: orderIndex
  })
}

export async function addItemToCollection(
  ctx: { supabase: SupabaseClient },
  collectionId: string,
  renderId?: string,
  externalImageUrl?: string,
  applySettings?: GenerationSettings,
  orderIndex = 0
): Promise<communityRepo.CommunityItem> {
  // Validate that we have either a render ID or external URL
  if (!renderId && !externalImageUrl) {
    throw new Error('Either render_id or external_image_url must be provided')
  }

  if (renderId && externalImageUrl) {
    throw new Error('Cannot specify both render_id and external_image_url')
  }

  // Validate apply_settings if provided
  const validatedSettings = applySettings ? validateApplySettings(applySettings) : undefined

  return await communityRepo.createCommunityItem(ctx.supabase, {
    collection_id: collectionId,
    render_id: renderId,
    external_image_url: externalImageUrl,
    apply_settings: validatedSettings,
    order_index: orderIndex
  })
}

// --- Admin compatibility stubs (to satisfy API handlers) ---
export async function upsertCollection(
  ctx: { supabase: SupabaseClient },
  args: { id?: string; title: string; description?: string; coverImageUrl?: string; position?: number }
): Promise<{ id: string; title: string }> {
  if (args.id) {
    await communityRepo.updateCommunityCollection(ctx.supabase, args.id, {
      title: args.title,
      description: args.description,
      order_index: args.position ?? 0,
    })
    return { id: args.id, title: args.title }
  }
  const created = await communityRepo.createCommunityCollection(ctx.supabase, {
    title: args.title,
    description: args.description,
    is_featured: false,
    order_index: args.position ?? 0,
  } as any)
  return { id: created.id, title: created.title }
}

export async function deleteCollection(
  ctx: { supabase: SupabaseClient },
  args: { id: string }
): Promise<{ deleted: boolean }> {
  await communityRepo.deleteCommunityCollection(ctx.supabase, args.id)
  return { deleted: true }
}

export async function togglePublished(
  ctx: { supabase: SupabaseClient },
  args: { id: string; isPublished: boolean }
): Promise<{ id: string; isPublished: boolean }> {
  // Map publish state to is_featured flag for visibility
  await communityRepo.updateCommunityCollection(ctx.supabase, args.id, { is_featured: args.isPublished } as any)
  return { id: args.id, isPublished: args.isPublished }
}

export async function upsertItem(
  ctx: { supabase: SupabaseClient },
  args: { id?: string; collectionId: string; title?: string; imageUrl: string; tags?: string[]; position?: number }
): Promise<{ id: string; collectionId: string }> {
  if (args.id) {
    await communityRepo.updateCommunityItem(ctx.supabase, args.id, {
      external_image_url: args.imageUrl,
      order_index: args.position ?? 0,
    } as any)
    return { id: args.id, collectionId: args.collectionId }
  }
  const created = await communityRepo.createCommunityItem(ctx.supabase, {
    collection_id: args.collectionId,
    external_image_url: args.imageUrl,
    order_index: args.position ?? 0,
  } as any)
  return { id: created.id, collectionId: args.collectionId }
}

export async function deleteItem(
  ctx: { supabase: SupabaseClient },
  args: { id: string }
): Promise<{ deleted: boolean }> {
  await communityRepo.deleteCommunityItem(ctx.supabase, args.id)
  return { deleted: true }
}
