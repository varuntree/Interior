import type { SupabaseClient } from '@supabase/supabase-js'

export interface Render {
  id: string
  job_id: string
  owner_id: string
  mode: string
  room_type?: string
  style?: string
  cover_variant: number
  created_at: string
}

export interface RenderVariant {
  id: string
  render_id: string
  owner_id: string
  idx: number
  image_path: string
  thumb_path?: string
  created_at: string
}

export async function createRender(
  supabase: SupabaseClient,
  render: Omit<Render, 'id' | 'created_at'>
): Promise<Render> {
  const { data, error } = await supabase
    .from('renders')
    .insert(render)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function addVariant(
  supabase: SupabaseClient,
  variant: Omit<RenderVariant, 'id' | 'created_at'>
): Promise<RenderVariant> {
  const { data, error } = await supabase
    .from('render_variants')
    .insert(variant)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function listRenders(
  supabase: SupabaseClient,
  ownerId: string,
  filters?: {
    mode?: string
    room_type?: string
    style?: string
  },
  pagination?: {
    limit?: number
    cursor?: string
  }
): Promise<{ items: Render[]; nextCursor?: string }> {
  let query = supabase
    .from('renders')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  
  if (filters?.mode) query = query.eq('mode', filters.mode)
  if (filters?.room_type) query = query.eq('room_type', filters.room_type)
  if (filters?.style) query = query.eq('style', filters.style)
  
  const limit = pagination?.limit || 24
  query = query.limit(limit + 1)
  
  if (pagination?.cursor) {
    query = query.lt('created_at', pagination.cursor)
  }
  
  const { data, error } = await query
  if (error) throw error
  
  const hasMore = data.length > limit
  const items = hasMore ? data.slice(0, -1) : data
  const nextCursor = hasMore ? items[items.length - 1].created_at : undefined
  
  return { items, nextCursor }
}

/**
 * Batch fetch variants for multiple renders to avoid N+1 queries in services.
 */
export async function getVariantsByRenderIds(
  supabase: SupabaseClient,
  renderIds: string[]
): Promise<RenderVariant[]> {
  if (renderIds.length === 0) return []
  const { data, error } = await supabase
    .from('render_variants')
    .select('*')
    .in('render_id', renderIds)
    .order('render_id', { ascending: true })
    .order('idx', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Server-side search with simple ilike on mode, room_type, style.
 * Mirrors listRenders pagination semantics.
 */
export async function searchRenders(
  supabase: SupabaseClient,
  ownerId: string,
  query: string,
  pagination?: { limit?: number; cursor?: string }
): Promise<{ items: Render[]; nextCursor?: string }> {
  let q = supabase
    .from('renders')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  const limit = pagination?.limit || 24
  q = q.limit(limit + 1)

  // Apply cursor if provided
  if (pagination?.cursor) {
    q = q.lt('created_at', pagination.cursor)
  }

  const needle = query.trim()
  if (needle) {
    // Simple ilike across a couple of text columns
    // PostgREST or() applies OR across provided conditions
    q = q.or(
      [
        `mode.ilike.%${needle}%`,
        `room_type.ilike.%${needle}%`,
        `style.ilike.%${needle}%`,
      ].join(',')
    )
  }

  const { data, error } = await q
  if (error) throw error

  const hasMore = (data?.length || 0) > limit
  const items = hasMore ? data!.slice(0, -1) : (data || [])
  const nextCursor = hasMore ? items[items.length - 1].created_at : undefined

  return { items, nextCursor }
}

export async function getRenderWithVariants(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
): Promise<{ render: Render; variants: RenderVariant[] } | null> {
  const { data: render, error: renderError } = await supabase
    .from('renders')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single()
  
  if (renderError && renderError.code !== 'PGRST116') throw renderError
  if (!render) return null
  
  const { data: variants, error: variantsError } = await supabase
    .from('render_variants')
    .select('*')
    .eq('render_id', id)
    .order('idx')
  
  if (variantsError) throw variantsError
  
  return { render, variants: variants || [] }
}

export async function deleteRender(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
): Promise<void> {
  const { error } = await supabase
    .from('renders')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId)
  
  if (error) throw error
}

export async function batchGetRenders(
  supabase: SupabaseClient,
  renderIds: string[],
  ownerId: string
): Promise<Render[]> {
  if (renderIds.length === 0) return []
  
  const { data, error } = await supabase
    .from('renders')
    .select('*')
    .eq('owner_id', ownerId)
    .in('id', renderIds)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getRenderById(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
): Promise<Render | null> {
  const { data, error } = await supabase
    .from('renders')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function findRenderByJobId(
  supabase: SupabaseClient,
  jobId: string,
  ownerId: string
): Promise<Render | null> {
  const { data, error } = await supabase
    .from('renders')
    .select('*')
    .eq('job_id', jobId)
    .eq('owner_id', ownerId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function getVariantsByRender(
  supabase: SupabaseClient,
  renderId: string
): Promise<RenderVariant[]> {
  const { data, error } = await supabase
    .from('render_variants')
    .select('*')
    .eq('render_id', renderId)
    .order('idx')
  
  if (error) throw error
  return data || []
}

export async function findVariantByRenderAndIdx(
  supabase: SupabaseClient,
  renderId: string,
  idx: number
): Promise<RenderVariant | null> {
  const { data, error } = await supabase
    .from('render_variants')
    .select('*')
    .eq('render_id', renderId)
    .eq('idx', idx)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data || null
}

export async function updateRenderCoverVariant(
  supabase: SupabaseClient,
  renderId: string,
  ownerId: string,
  coverVariant: number
): Promise<void> {
  const { error } = await supabase
    .from('renders')
    .update({ cover_variant: coverVariant })
    .eq('id', renderId)
    .eq('owner_id', ownerId)
  
  if (error) throw error
}

export async function countUserRenders(
  supabase: SupabaseClient,
  ownerId: string,
  filters?: {
    mode?: string
    room_type?: string
    style?: string
  }
): Promise<number> {
  let query = supabase
    .from('renders')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', ownerId)
  
  if (filters?.mode) query = query.eq('mode', filters.mode)
  if (filters?.room_type) query = query.eq('room_type', filters.room_type)
  if (filters?.style) query = query.eq('style', filters.style)
  
  const { count, error } = await query
  if (error) throw error
  
  return count || 0
}

export async function getRecentRenders(
  supabase: SupabaseClient,
  ownerId: string,
  limit = 10
): Promise<Render[]> {
  const { data, error } = await supabase
    .from('renders')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data || []
}
