import { withMethods } from '@/libs/api-utils/methods';
import { ok, fail } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as favoritesService from '@/libs/services/favorites';
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic';

async function handleGET(req: Request, ctx?: { logger?: any }) {
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

    ctx?.logger?.info?.('favorites.list', { userId: user.id, count: (result as any)?.items?.length })
    return ok(result, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error: any) {
    const status = error?.status || 500;
    const message = error?.message || 'Internal server error';
    ctx?.logger?.error?.('favorites.list_error', { message })
    return fail(status, 'INTERNAL_ERROR', message);
  }
}

export const GET = withMethods(['GET'], withRequestContext(handleGET as any));
