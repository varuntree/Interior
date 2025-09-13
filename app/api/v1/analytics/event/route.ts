import { z } from 'zod';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { withMethods } from '@/libs/api-utils/methods';
import { validateRequest } from '@/libs/api-utils/validate';
import { ok } from '@/libs/api-utils/responses';
import { logEvent } from '@/libs/services/analytics'
import { withRequestContext } from '@/libs/observability/request'

const EventSchema = z.object({
  type: z.enum(['page', 'generation_submit', 'generation_done', 'error']),
  payload: z.any().optional()
});

export const dynamic = 'force-dynamic'

export const POST = withMethods(['POST'], withRequestContext(async (req: Request, ctx?: { logger?: any }) => {
    try {
      const body = await validateRequest(req, EventSchema);
      const supabase = createServiceSupabaseClient();
      
      // Get user ID if authenticated, null if anonymous
      const { data: { user } } = await supabase.auth.getUser();
      
      // Clamp payload size (basic guard)
      const payload = (() => {
        try {
          const json = JSON.stringify(body.payload || {})
          if (json.length > 8_000) return { truncated: true }
          return body.payload
        } catch {
          return undefined
        }
      })()

      await logEvent({ supabase }, { userId: user?.id || null, type: body.type, payload })
      ctx?.logger?.info?.('analytics.event.logged', { type: body.type })
      
      return ok({ message: 'Event logged' });
    } catch (error) {
      // Analytics should never block user experience
      ctx?.logger?.warn?.('analytics.event.error', { message: (error as any)?.message })
      return ok({ message: 'Event logged' }); // Always return success
    }
}));
