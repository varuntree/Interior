import type { SupabaseClient } from '@supabase/supabase-js'
import * as rendersRepo from '@/libs/repositories/renders'
import * as collectionsRepo from '@/libs/repositories/collections'

export interface RenderWithVariants {
  id: string
  job_id: string
  owner_id: string
  mode: string
  room_type?: string
  style?: string
  cover_variant: number
  created_at: string
  variants: RenderVariantWithUrls[]
}

export interface RenderVariantWithUrls {
  id: string
  render_id: string
  owner_id: string
  idx: number
  image_path: string
  thumb_path?: string
  created_at: string
  image_url: string
  thumb_url?: string
}

export interface RenderListItem {
  id: string
  mode: string
  room_type?: string
  style?: string
  cover_variant: number
  created_at: string
  cover_variant_url: string
  cover_thumb_url?: string
  is_favorite?: boolean
}

export interface RenderFilters {
  mode?: string
  room_type?: string
  style?: string
}

export interface RenderPagination {
  limit?: number
  cursor?: string
}

export interface RenderListResponse {
  items: RenderListItem[]
  nextCursor?: string
  totalCount?: number
}

function buildImageUrl(imagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/${imagePath}`
}

function buildSignedUrl(imagePath: string, expiresIn = 3600): string {
  // For public images, we can use direct URLs
  return buildImageUrl(imagePath)
}

export async function formatRenderWithVariants(
  render: rendersRepo.Render,
  variants: rendersRepo.RenderVariant[]
): Promise<RenderWithVariants> {
  const formattedVariants: RenderVariantWithUrls[] = variants.map(variant => ({
    ...variant,
    image_url: buildImageUrl(variant.image_path),
    thumb_url: variant.thumb_path ? buildImageUrl(variant.thumb_path) : undefined
  }))

  return {
    ...render,
    variants: formattedVariants
  }
}

export async function listUserRenders(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  filters?: RenderFilters,
  pagination?: RenderPagination
): Promise<RenderListResponse> {
  const { items, nextCursor } = await rendersRepo.listRenders(
    ctx.supabase,
    ownerId,
    filters,
    pagination
  )

  // Fetch cover variant image paths to avoid extension assumptions
  const renderListItems: RenderListItem[] = []
  const renderIds: string[] = items.map(r => r.id)
  let favoriteSet: Set<string> = new Set()
  try {
    favoriteSet = await collectionsRepo.getFavoritesMembership(ctx.supabase, ownerId, renderIds)
  } catch {}
  for (const render of items) {
    let coverUrl: string | undefined
    let coverThumbUrl: string | undefined
    try {
      const variant = await rendersRepo.findVariantByRenderAndIdx(ctx.supabase, render.id, render.cover_variant)
      if (variant) {
        coverUrl = buildImageUrl(variant.image_path)
        if (variant.thumb_path) {
          coverThumbUrl = buildImageUrl(variant.thumb_path)
        }
      }
    } catch {
      // fall through; URLs remain undefined
    }

    renderListItems.push({
      id: render.id,
      mode: render.mode,
      room_type: render.room_type,
      style: render.style,
      cover_variant: render.cover_variant,
      created_at: render.created_at,
      cover_variant_url: coverUrl ?? buildImageUrl(`renders/${render.id}/${render.cover_variant}.jpg`),
      cover_thumb_url: coverThumbUrl,
      is_favorite: favoriteSet.has(render.id),
    })
  }

  // Get total count if this is the first page
  let totalCount: number | undefined
  if (!pagination?.cursor) {
    totalCount = await rendersRepo.countUserRenders(ctx.supabase, ownerId, filters)
  }

  return {
    items: renderListItems,
    nextCursor,
    totalCount
  }
}

export async function getRenderDetails(
  ctx: { supabase: SupabaseClient },
  renderId: string,
  ownerId: string
): Promise<RenderWithVariants | null> {
  const result = await rendersRepo.getRenderWithVariants(ctx.supabase, renderId, ownerId)
  
  if (!result) {
    return null
  }

  return await formatRenderWithVariants(result.render, result.variants)
}

export async function getVariantsForJob(
  ctx: { supabase: SupabaseClient },
  jobId: string,
  ownerId: string
): Promise<Array<{ index: number; url: string; thumbUrl?: string; renderId: string }>> {
  // Find the render created by this job for this owner
  const { data: renders, error } = await ctx.supabase
    .from('renders')
    .select('id')
    .eq('job_id', jobId)
    .eq('owner_id', ownerId)
    .limit(1)

  if (error) throw error
  if (!renders || renders.length === 0) return []

  const renderData = await rendersRepo.getRenderWithVariants(ctx.supabase, renders[0].id, ownerId)
  if (!renderData) return []

  const formatted = await formatRenderWithVariants(renderData.render, renderData.variants)
  return formatted.variants.map(v => ({ index: v.idx, url: v.image_url, thumbUrl: v.thumb_url, renderId: formatted.id }))
}

export async function deleteRendersByJob(
  ctx: { supabase: SupabaseClient },
  jobId: string,
  ownerId: string
): Promise<void> {
  const { data: renders, error } = await ctx.supabase
    .from('renders')
    .select('id')
    .eq('job_id', jobId)
    .eq('owner_id', ownerId)

  if (error) throw error
  if (!renders || renders.length === 0) return

  for (const r of renders) {
    await rendersRepo.deleteRender(ctx.supabase, r.id, ownerId)
  }
}

export async function deleteUserRender(
  ctx: { supabase: SupabaseClient },
  renderId: string,
  ownerId: string
): Promise<void> {
  // Verify ownership and existence
  const render = await rendersRepo.getRenderById(ctx.supabase, renderId, ownerId)
  
  if (!render) {
    throw new Error('Render not found or access denied')
  }

  // Delete the render (cascade will delete variants and collection items)
  await rendersRepo.deleteRender(ctx.supabase, renderId, ownerId)
}

export async function updateRenderCover(
  ctx: { supabase: SupabaseClient },
  renderId: string,
  ownerId: string,
  variantIndex: number
): Promise<void> {
  // Verify the variant exists
  const variants = await rendersRepo.getVariantsByRender(ctx.supabase, renderId)
  const variant = variants.find(v => v.idx === variantIndex && v.owner_id === ownerId)
  
  if (!variant) {
    throw new Error('Variant not found or access denied')
  }

  await rendersRepo.updateRenderCoverVariant(ctx.supabase, renderId, ownerId, variantIndex)
}

export async function getRecentUserRenders(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  limit = 10
): Promise<RenderListItem[]> {
  const renders = await rendersRepo.getRecentRenders(ctx.supabase, ownerId, limit)

  const items: RenderListItem[] = []
  let favoriteSet: Set<string> = new Set()
  try {
    favoriteSet = await collectionsRepo.getFavoritesMembership(ctx.supabase, ownerId, renders.map(r => r.id))
  } catch {}
  for (const render of renders) {
    let coverUrl: string | undefined
    let coverThumbUrl: string | undefined
    try {
      const variant = await rendersRepo.findVariantByRenderAndIdx(ctx.supabase, render.id, render.cover_variant)
      if (variant) {
        coverUrl = buildImageUrl(variant.image_path)
        if (variant.thumb_path) coverThumbUrl = buildImageUrl(variant.thumb_path)
      }
    } catch {}

    items.push({
      id: render.id,
      mode: render.mode,
      room_type: render.room_type,
      style: render.style,
      cover_variant: render.cover_variant,
      created_at: render.created_at,
      cover_variant_url: coverUrl ?? buildImageUrl(`renders/${render.id}/${render.cover_variant}.jpg`),
      cover_thumb_url: coverThumbUrl,
      is_favorite: favoriteSet.has(render.id),
    })
  }

  return items
}

export async function getRenderStatistics(
  ctx: { supabase: SupabaseClient },
  ownerId: string
): Promise<{
  totalRenders: number
  rendersByMode: Record<string, number>
  rendersByStyle: Record<string, number>
  rendersByRoomType: Record<string, number>
}> {
  // Get all user renders for statistics
  const { items: allRenders } = await rendersRepo.listRenders(
    ctx.supabase,
    ownerId,
    {},
    { limit: 1000 } // Get a large number for stats
  )

  const totalRenders = allRenders.length

  // Calculate breakdowns
  const rendersByMode: Record<string, number> = {}
  const rendersByStyle: Record<string, number> = {}
  const rendersByRoomType: Record<string, number> = {}

  allRenders.forEach(render => {
    // Count by mode
    rendersByMode[render.mode] = (rendersByMode[render.mode] || 0) + 1

    // Count by style
    if (render.style) {
      rendersByStyle[render.style] = (rendersByStyle[render.style] || 0) + 1
    }

    // Count by room type
    if (render.room_type) {
      rendersByRoomType[render.room_type] = (rendersByRoomType[render.room_type] || 0) + 1
    }
  })

  return {
    totalRenders,
    rendersByMode,
    rendersByStyle,
    rendersByRoomType
  }
}

export async function batchDeleteRenders(
  ctx: { supabase: SupabaseClient },
  renderIds: string[],
  ownerId: string
): Promise<{ deleted: number; errors: string[] }> {
  if (renderIds.length === 0) {
    return { deleted: 0, errors: [] }
  }

  // Verify ownership of all renders first
  const ownedRenders = await rendersRepo.batchGetRenders(ctx.supabase, renderIds, ownerId)
  const ownedRenderIds = ownedRenders.map(r => r.id)
  
  const errors: string[] = []
  let deleted = 0

  // Delete each render individually to handle errors gracefully
  for (const renderId of ownedRenderIds) {
    try {
      await rendersRepo.deleteRender(ctx.supabase, renderId, ownerId)
      deleted++
    } catch (error) {
      errors.push(`Failed to delete render ${renderId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Add errors for renders not found
  const notFoundIds = renderIds.filter(id => !ownedRenderIds.includes(id))
  notFoundIds.forEach(id => {
    errors.push(`Render ${id} not found or access denied`)
  })

  return { deleted, errors }
}

export async function searchRenders(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  query: string,
  pagination?: RenderPagination
): Promise<RenderListResponse> {
  // For now, implement a simple search that looks for matches in style and room_type
  // In the future, this could be enhanced with full-text search
  const filters: RenderFilters = {}
  
  // Simple matching - in a real app you might use full-text search
  const normalizedQuery = query.toLowerCase().trim()
  
  // Get all renders and filter client-side for now
  // In production, you'd want to implement proper database search
  const { items, nextCursor } = await rendersRepo.listRenders(
    ctx.supabase,
    ownerId,
    filters,
    { limit: (pagination?.limit || 24) * 2 } // Get more to filter
  )

  const filteredItems = items.filter(render => {
    const searchableText = [
      render.mode,
      render.room_type,
      render.style
    ].filter(Boolean).join(' ').toLowerCase()
    
    return searchableText.includes(normalizedQuery)
  })

  // Apply pagination to filtered results
  const limit = pagination?.limit || 24
  const paginatedItems = filteredItems.slice(0, limit)

  const renderListItems: RenderListItem[] = []
  let favoriteSet: Set<string> = new Set()
  try {
    favoriteSet = await collectionsRepo.getFavoritesMembership(ctx.supabase, ownerId, paginatedItems.map(r => r.id))
  } catch {}
  for (const render of paginatedItems) {
    let coverUrl: string | undefined
    let coverThumbUrl: string | undefined
    try {
      const variant = await rendersRepo.findVariantByRenderAndIdx(ctx.supabase, render.id, render.cover_variant)
      if (variant) {
        coverUrl = buildImageUrl(variant.image_path)
        if (variant.thumb_path) coverThumbUrl = buildImageUrl(variant.thumb_path)
      }
    } catch {}

    renderListItems.push({
      id: render.id,
      mode: render.mode,
      room_type: render.room_type,
      style: render.style,
      cover_variant: render.cover_variant,
      created_at: render.created_at,
      cover_variant_url: coverUrl ?? buildImageUrl(`renders/${render.id}/${render.cover_variant}.jpg`),
      cover_thumb_url: coverThumbUrl,
      is_favorite: favoriteSet.has(render.id),
    })
  }

  return {
    items: renderListItems,
    nextCursor: filteredItems.length > limit ? nextCursor : undefined
  }
}
