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

export type CommunityImagesCursor = {
  oi: number; // order_index
  ca: string; // created_at ISO string
  id: string; // id as tie-breaker
}

export async function listPublishedImagesPage(
  supabase: SupabaseClient,
  args: { limit?: number; cursor?: string | null }
): Promise<{ items: CommunityImageRow[]; nextCursor?: string }> {
  const limit = Math.max(1, Math.min(100, args.limit ?? 24))

  let query = supabase
    .from('community_images')
    .select('*')
    .eq('is_published', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(limit + 1)

  if (args.cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(args.cursor, 'base64').toString('utf8')) as CommunityImagesCursor
      const filter = [
        `order_index.gt.${decoded.oi}`,
        `and(order_index.eq.${decoded.oi},created_at.lt.${decoded.ca})`,
        `and(order_index.eq.${decoded.oi},created_at.eq.${decoded.ca},id.gt.${decoded.id})`,
      ].join(',')
      // Apply keyset pagination filter
      // @ts-ignore - supabase-js accepts the or() string expression
      query = query.or(filter)
    } catch {
      // ignore bad cursor and treat as first page
    }
  }

  const { data, error } = await query
  if (error) throw error

  const hasMore = (data?.length || 0) > limit
  const items = hasMore ? (data as CommunityImageRow[]).slice(0, -1) : (data as CommunityImageRow[] | null) || []
  let nextCursor: string | undefined
  if (hasMore && items.length) {
    const last = items[items.length - 1]
    const cursor: CommunityImagesCursor = { oi: last.order_index, ca: last.created_at, id: last.id }
    nextCursor = Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64')
  }

  return { items, nextCursor }
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
