import { z } from 'zod';
import { withMethods } from '@/libs/api-utils/methods';
import { validate } from '@/libs/api-utils/validate';
import { ok, fail } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as collectionsService from '@/libs/services/collections';
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic';

const ToggleItemSchema = z.object({
  collectionId: z.string().uuid('Collection ID must be a valid UUID'),
  generationId: z.string().uuid('Generation ID must be a valid UUID')
});

async function handlePOST(req: Request, ctx?: { logger?: any }) {
  const supabase = createServiceSupabaseClient();
  
  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return fail(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const body = await req.json().catch(() => ({}));

  // Validate request body
  const validation = validate(ToggleItemSchema, body);
  if (!validation.ok) {
    return (validation as { ok: false; res: Response }).res;
  }
  
  const { collectionId, generationId } = validation.data;

  try {
    const result = await collectionsService.toggleCollectionItem(
      { supabase },
      {
        userId: user.id,
        collectionId,
        generationId
      }
    );
    ctx?.logger?.info?.('collections.items.toggle', { userId: user.id, collectionId, generationId, isFavorite: (result as any)?.isFavorite })
    return ok(result, {
      headers: { 'Cache-Control': 'private, no-store' }
    });
  } catch (error: any) {
    const status = error?.status || 500;
    const message = error?.message || 'Internal server error';
    ctx?.logger?.error?.('collections.items.toggle_error', { message })
    return fail(status, 'INTERNAL_ERROR', message);
  }
}

export const POST = withMethods(['POST'], withRequestContext(handlePOST as any));
