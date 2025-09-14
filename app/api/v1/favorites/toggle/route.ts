import { z } from 'zod';
import { withMethods } from '@/libs/api-utils/methods';
import { validate } from '@/libs/api-utils/validate';
import { ok, fail } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as favoritesService from '@/libs/services/favorites';
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic';

const ToggleFavoriteSchema = z.union([
  z.object({ generationId: z.string().uuid('Generation ID must be a valid UUID') }),
  z.object({ communityImageId: z.string().uuid('Community image ID must be a valid UUID') })
]);

async function handlePOST(req: Request, ctx?: { logger?: any }) {
  const supabase = createServiceSupabaseClient();
  
  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return fail(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const body = await req.json().catch(() => ({}));

  // Validate request body
  const validation = validate(ToggleFavoriteSchema, body);
  if (!validation.ok) {
    return (validation as { ok: false; res: Response }).res;
  }

  try {
    const result = await favoritesService.toggleFavorite(
      { supabase },
      ({
        userId: user.id,
        ...(validation.data as any)
      } as any)
    );
    ctx?.logger?.info?.('favorites.toggle', { userId: user.id, isFavorite: (result as any)?.isFavorite })
    return ok(result, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error: any) {
    const status = error?.status || 500;
    const message = error?.message || 'Internal server error';
    ctx?.logger?.error?.('favorites.toggle_error', { message })
    return fail(status, 'INTERNAL_ERROR', message);
  }
}

export const POST = withMethods(['POST'], withRequestContext(handlePOST as any));
