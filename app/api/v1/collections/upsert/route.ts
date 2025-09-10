import { z } from 'zod';
import { withMethods } from '@/libs/api-utils/methods';
import { validate } from '@/libs/api-utils/validate';
import { ok, fail } from '@/libs/api-utils/responses';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import * as collectionsService from '@/libs/services/collections';

const UpsertCollectionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less')
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
  const validation = validate(UpsertCollectionSchema, body);
  if (!validation.ok) {
    return (validation as { ok: false; res: Response }).res;
  }

  try {
    const result = await collectionsService.upsertCollection(
      { supabase },
      {
        userId: user.id,
        id: validation.data.id,
        title: validation.data.title
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

export const POST = withMethods(['POST'], handlePOST as any);
