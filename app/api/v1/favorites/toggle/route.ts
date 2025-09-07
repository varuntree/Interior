import { z } from 'zod';
import { withMethods } from '@/libs/api-utils/handler';
import { validate } from '@/libs/api-utils/validate';
import { ok, fail } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as favoritesService from '@/libs/services/favorites';

const ToggleFavoriteSchema = z.object({
  generationId: z.string().uuid('Generation ID must be a valid UUID')
});

async function handlePOST(req: Request) {
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
      {
        userId: user.id,
        generationId: validation.data.generationId
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

export const POST = withMethods({
  POST: handlePOST
});
