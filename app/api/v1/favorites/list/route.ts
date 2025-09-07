import { withMethods } from '@/libs/api-utils/handler';
import { ok, fail } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as favoritesService from '@/libs/services/favorites';

async function handleGET(req: Request) {
  const supabase = createServiceSupabaseClient();
  
  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return fail(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const limitStr = url.searchParams.get('limit') || '24';
  const limit = Math.min(Math.max(parseInt(limitStr) || 24, 1), 50);

  try {
    const result = await favoritesService.listFavorites(
      { supabase },
      {
        userId: user.id,
        cursor,
        limit
      }
    );

    return ok(result, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || 'Internal server error';

    return Response.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message } },
      { status, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}

export const GET = withMethods({
  GET: handleGET
});
