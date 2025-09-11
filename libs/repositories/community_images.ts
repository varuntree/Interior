import type { SupabaseClient } from '@supabase/supabase-js'

export interface CommunityImageRow {
  id: string
  image_path?: string
  thumb_path?: string
  external_url?: string
  title?: string
  tags?: string[]
  apply_settings?: any
  is_published: boolean
  order_index: number
  created_at: string
}

export async function listPublishedImages(
  supabase: SupabaseClient,
  limit = 24
): Promise<CommunityImageRow[]> {
  const { data, error } = await supabase
    .from('community_images')
    .select('*')
    .eq('is_published', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function searchImages(
  supabase: SupabaseClient,
  query: string,
  limit = 24
): Promise<CommunityImageRow[]> {
  // Simple search across title, tags, and apply_settings fields
  const orParts = [
    `title.ilike.%${query}%`,
    `apply_settings->>'style'.ilike.%${query}%`,
    `apply_settings->>'roomType'.ilike.%${query}%`,
    `apply_settings->>'prompt'.ilike.%${query}%`,
  ]

  const { data, error } = await supabase
    .from('community_images')
    .select('*')
    .eq('is_published', true)
    .or(orParts.join(','))
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

