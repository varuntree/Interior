import type { SupabaseClient } from '@supabase/supabase-js'
import * as imagesRepo from '@/libs/repositories/community_images'

export interface CommunityCollectionSummary {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
}

export async function getCommunityCollectionsSummary(
  supabase: SupabaseClient
): Promise<CommunityCollectionSummary[]> {
  const rows = await imagesRepo.listPublishedImages(supabase, 1)
  const cover = rows[0]
  const coverUrl = cover
    ? cover.external_url || (cover.image_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/${cover.image_path}` : null)
    : null

  return [
    {
      id: 'community',
      title: 'Inspiration',
      description: null,
      cover_image_url: coverUrl,
    },
  ]
}

