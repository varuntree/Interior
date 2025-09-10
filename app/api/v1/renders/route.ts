// app/api/v1/renders/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { createClient } from '@/libs/supabase/server'
import { listUserRenders } from '@/libs/services/renders'

export const dynamic = 'force-dynamic'

// Query parameter validation schema
const QuerySchema = z.object({
  mode: z.enum(['redesign', 'staging', 'compose', 'imagine']).optional(),
  roomType: z.string().optional(),
  style: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(24),
  cursor: z.string().optional(),
  search: z.string().optional()
})

export const GET = withMethods(['GET'], async (req: NextRequest) => {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Parse and validate query parameters
    const url = new URL(req.url)
    const get = (key: string) => {
      const v = url.searchParams.get(key)
      return v === null ? undefined : v
    }
    const queryParams = {
      mode: get('mode'),
      roomType: get('roomType'),
      style: get('style'),
      limit: get('limit'),
      cursor: get('cursor'),
      search: get('search')
    }

    const parsedQuery = QuerySchema.safeParse(queryParams)
    if (!parsedQuery.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid query parameters', parsedQuery.error.flatten())
    }

    const { mode, roomType, style, limit, cursor, search } = parsedQuery.data

    // Build filters object
    const filters: any = {}
    if (mode) filters.mode = mode
    if (roomType) filters.room_type = roomType
    if (style) filters.style = style

    // Build pagination object
    const pagination = {
      limit,
      cursor
    }

    // Get service client
    const serviceSupabase = createServiceSupabaseClient()

    // Get renders using service
    let result
    if (search) {
      // Use search functionality
      const { searchRenders } = await import('@/libs/services/renders')
      result = await searchRenders(
        { supabase: serviceSupabase },
        user.id,
        search,
        pagination
      )
    } else {
      // Regular filtered list
      result = await listUserRenders(
        { supabase: serviceSupabase },
        user.id,
        filters,
        pagination
      )
    }

    // Build response
    const response = {
      renders: result.items,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: !!result.nextCursor,
        limit
      },
      totalCount: result.totalCount,
      filters: {
        mode,
        roomType,
        style,
        search
      }
    }

    return ok(response)

  } catch (error: any) {
    console.error('List renders error:', error)
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch renders')
  }
})
