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