import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import * as imagesRepo from '@/libs/repositories/community_images'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], async () => {
  try {
    const supabase = createServiceSupabaseClient()
    const rows = await imagesRepo.listPublishedImages(supabase, 1)
    const cover = rows[0]
    const coverUrl = cover
      ? cover.external_url || (cover.image_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/${cover.image_path}` : null)
      : null

    return ok({
      collections: [
        {
          id: 'community',
          title: 'Inspiration',
          description: null,
          cover_image_url: coverUrl,
        },
      ],
    })
  } catch (err) {
    return fail(500, 'INTERNAL_ERROR', 'Failed to load community collections')
  }
})
