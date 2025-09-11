import type { SupabaseClient } from '@supabase/supabase-js'
import * as imagesRepo from '@/libs/repositories/community_images'
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
  // Using community_images (flat). Synthesize a single collection.
  const images = await imagesRepo.listPublishedImages(ctx.supabase, itemsPerCollection)
  const items = images.map(formatImageRowToUI)
  return [
    {
      id: 'community',
      title: featuredOnly ? 'Featured' : 'Inspiration',
      description: undefined,
      is_featured: true,
      order_index: 0,
      created_at: new Date().toISOString(),
      items,
    },
  ]
}

export async function getCommunityCollectionDetails(
  ctx: { supabase: SupabaseClient },
  _collectionId: string
): Promise<CommunityCollectionForUI | null> {
  const images = await imagesRepo.listPublishedImages(ctx.supabase, 50)
  const items = images.map(formatImageRowToUI)
  return {
    id: 'community',
    title: 'Inspiration',
    description: undefined,
    is_featured: true,
    order_index: 0,
    created_at: new Date().toISOString(),
    items,
  }
}

export function formatImageRowToUI(img: imagesRepo.CommunityImageRow): CommunityItemForUI {
  const imageUrl = img.external_url
    ? img.external_url
    : img.image_path
    ? buildPublicUrl(img.image_path)
    : '/placeholder-image.jpg'
  const thumbUrl = img.thumb_path ? buildPublicUrl(img.thumb_path) : undefined
  return {
    id: img.id,
    collection_id: 'community',
    order_index: img.order_index,
    created_at: img.created_at,
    image_url: imageUrl,
    thumb_url: thumbUrl,
    apply_settings: img.apply_settings ?? undefined,
    source_type: img.external_url ? 'external' : 'internal',
    render_id: undefined,
  }
}

function buildPublicUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/${path}`
}

async function hydrateCommunityItemUrls(
  supabase: SupabaseClient,
  item: CommunityItemForUI,
  raw: any
): Promise<CommunityItemForUI> {
  if (item.source_type === 'internal' && raw?.render_id && raw?.render) {
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
  const rows = await imagesRepo.searchImages(ctx.supabase, query, limit)
  return rows.map(formatImageRowToUI)
}

export async function getFeaturedCollections(
  ctx: { supabase: SupabaseClient },
  itemsPerCollection = 6
): Promise<CommunityCollectionForUI[]> {
  return await getCommunityGallery(ctx, true, itemsPerCollection)
}

// Public read helpers for API routes
export async function listPublishedCollections(
  _ctx: { supabase: SupabaseClient }
): Promise<any[]> {
  // With community_images there are no collections; return empty list
  return []
}

export async function listPublishedItems(
  ctx: { supabase: SupabaseClient },
  _args: { collectionId: string }
): Promise<any[]> {
  const rows = await imagesRepo.listPublishedImages(ctx.supabase, 50)
  return rows.map(r => ({
    id: r.id,
    collection_id: 'community',
    image_url: r.external_url || (r.image_path ? buildPublicUrl(r.image_path) : ''),
    thumb_url: r.thumb_path ? buildPublicUrl(r.thumb_path) : undefined,
    apply_settings: r.apply_settings,
    order_index: r.order_index,
    created_at: r.created_at,
  }))
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
// (Legacy admin collection helpers removed in favor of community_images-only flow)
