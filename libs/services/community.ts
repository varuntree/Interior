import type { SupabaseClient } from '@supabase/supabase-js'
import * as communityRepo from '@/libs/repositories/community'

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
  aspectRatio?: string
  quality?: string
  variants?: number
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

  return collectionsWithItems.map(({ collection, items }) => ({
    id: collection.id,
    title: collection.title,
    description: collection.description,
    is_featured: collection.is_featured,
    order_index: collection.order_index,
    created_at: collection.created_at,
    items: items.map(formatCommunityItemForUI)
  }))
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

  return {
    id: collection.id,
    title: collection.title,
    description: collection.description,
    is_featured: collection.is_featured,
    order_index: collection.order_index,
    created_at: collection.created_at,
    items: items.map(formatCommunityItemForUI)
  }
}

export function formatCommunityItemForUI(item: communityRepo.CommunityItemWithRender): CommunityItemForUI {
  let image_url: string
  let thumb_url: string | undefined
  let source_type: 'internal' | 'external'

  if (item.render_id && item.render) {
    // Internal render
    source_type = 'internal'
    image_url = item.render.cover_image_url
    thumb_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/renders/${item.render.id}/${item.render.cover_variant}_thumb.webp`
  } else if (item.external_image_url) {
    // External image
    source_type = 'external'
    image_url = item.external_image_url
    thumb_url = item.external_image_url // Could be processed for thumbnails
  } else {
    // Fallback
    source_type = 'external'
    image_url = '/placeholder-image.jpg'
  }

  return {
    id: item.id,
    collection_id: item.collection_id,
    order_index: item.order_index,
    created_at: item.created_at,
    image_url,
    thumb_url,
    apply_settings: item.apply_settings,
    source_type,
    render_id: item.render_id
  }
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
  if (item.apply_settings.aspectRatio) settings.aspectRatio = item.apply_settings.aspectRatio
  if (item.apply_settings.quality) settings.quality = item.apply_settings.quality
  if (item.apply_settings.variants) settings.variants = item.apply_settings.variants

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
  const stringFields = ['roomType', 'style', 'prompt', 'aspectRatio', 'quality']
  stringFields.forEach(field => {
    if (settings[field] && typeof settings[field] === 'string') {
      (validSettings as any)[field] = settings[field]
    }
  })

  // Validate variants (number)
  if (settings.variants && typeof settings.variants === 'number' && settings.variants >= 1 && settings.variants <= 3) {
    validSettings.variants = settings.variants
  }

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
  
  const aspectRatio = params.get('aspectRatio')
  if (aspectRatio) settings.aspectRatio = aspectRatio
  
  const quality = params.get('quality')
  if (quality) settings.quality = quality
  
  const variants = params.get('variants')
  if (variants) {
    const variantsNum = parseInt(variants, 10)
    if (!isNaN(variantsNum) && variantsNum >= 1 && variantsNum <= 3) {
      settings.variants = variantsNum
    }
  }
  
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