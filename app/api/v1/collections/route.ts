// app/api/v1/collections/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { createClient } from '@/libs/supabase/server'
import { listUserCollections, createUserCollection, ensureDefaultFavorites } from '@/libs/services/collections'

export const dynamic = 'force-dynamic'

// Validation schemas
const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100).trim()
})

// eslint-disable-next-line no-unused-vars
export const GET = withMethods(['GET'], async (req: NextRequest) => {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Get service client
    const serviceSupabase = createServiceSupabaseClient()

    // Ensure user has default favorites collection
    await ensureDefaultFavorites({ supabase: serviceSupabase }, user.id)

    // Get user's collections
    const collections = await listUserCollections({ supabase: serviceSupabase }, user.id)

    // Build response
    const response = {
      collections: collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        isDefaultFavorites: collection.is_default_favorites,
        itemCount: collection.item_count,
        createdAt: collection.created_at
      }))
    }

    return ok(response)

  } catch (error: any) {
    console.error('List collections error:', error)
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch collections')
  }
})

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Parse and validate request body
    const body = await req.json()
    const parsed = CreateCollectionSchema.safeParse(body)
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', parsed.error.flatten())
    }

    const { name } = parsed.data

    // Get service client
    const serviceSupabase = createServiceSupabaseClient()

    // Create collection
    const collection = await createUserCollection(
      { supabase: serviceSupabase },
      user.id,
      name
    )

    // Build response
    const response = {
      id: collection.id,
      name: collection.name,
      isDefaultFavorites: collection.is_default_favorites,
      itemCount: 0,
      createdAt: collection.created_at
    }

    return ok(response, 'Collection created successfully')

  } catch (error: any) {
    console.error('Create collection error:', error)

    if (error.message === 'Collection name cannot be empty' || error.message === 'Collection name too long') {
      return fail(400, 'VALIDATION_ERROR', error.message)
    }

    return fail(500, 'INTERNAL_ERROR', 'Failed to create collection')
  }
})
