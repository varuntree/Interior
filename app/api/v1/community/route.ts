// app/api/v1/community/route.ts
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { CACHE_CONFIGS } from '@/libs/api-utils/cache'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { getCommunityGallery, getFeaturedCollections } from '@/libs/services/community'

export const dynamic = 'force-dynamic'

export const GET = withMethods({
  GET: async (req: NextRequest) => {
  try {
    // Parse query parameters
    const url = new URL(req.url)
    const featuredOnly = url.searchParams.get('featured') === 'true'
    const itemsPerCollection = parseInt(url.searchParams.get('itemsPerCollection') || '10')
    const search = url.searchParams.get('search')

    // Get service client (no auth required for community endpoint)
    const serviceSupabase = createServiceSupabaseClient()

    let response

    if (search) {
      // Search community content
      const { searchCommunityContent } = await import('@/libs/services/community')
      const items = await searchCommunityContent(
        { supabase: serviceSupabase },
        search,
        20
      )

      response = {
        type: 'search',
        query: search,
        items: items.map(item => ({
          id: item.id,
          collectionId: item.collection_id,
          imageUrl: item.image_url,
          thumbUrl: item.thumb_url,
          sourceType: item.source_type,
          applySettings: item.apply_settings,
          createdAt: item.created_at,
          render: item.render_id ? {
            id: item.render_id,
            mode: item.apply_settings?.mode,
            roomType: item.apply_settings?.roomType,
            style: item.apply_settings?.style
          } : null
        }))
      }
    } else if (featuredOnly) {
      // Get only featured collections
      const collections = await getFeaturedCollections(
        { supabase: serviceSupabase },
        itemsPerCollection
      )

      response = {
        type: 'featured',
        collections: collections.map(collection => ({
          id: collection.id,
          title: collection.title,
          description: collection.description,
          isFeatured: collection.is_featured,
          orderIndex: collection.order_index,
          itemCount: collection.items.length,
          items: collection.items.map(item => ({
            id: item.id,
            imageUrl: item.image_url,
            thumbUrl: item.thumb_url,
            sourceType: item.source_type,
            applySettings: item.apply_settings,
            createdAt: item.created_at
          }))
        }))
      }
    } else {
      // Get all community collections
      const collections = await getCommunityGallery(
        { supabase: serviceSupabase },
        false,
        itemsPerCollection
      )

      response = {
        type: 'gallery',
        collections: collections.map(collection => ({
          id: collection.id,
          title: collection.title,
          description: collection.description,
          isFeatured: collection.is_featured,
          orderIndex: collection.order_index,
          itemCount: collection.items.length,
          createdAt: collection.created_at,
          items: collection.items.map(item => ({
            id: item.id,
            imageUrl: item.image_url,
            thumbUrl: item.thumb_url,
            sourceType: item.source_type,
            applySettings: item.apply_settings,
            createdAt: item.created_at,
            render: item.render_id ? {
              id: item.render_id,
              mode: item.apply_settings?.mode,
              roomType: item.apply_settings?.roomType,
              style: item.apply_settings?.style
            } : null
          }))
        }))
      }
    }

    // Return with caching headers for public content
    return ok(response, undefined, CACHE_CONFIGS.PUBLIC)

  } catch (error: any) {
    console.error('Community gallery error:', error)
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch community content')
  }
  }
})