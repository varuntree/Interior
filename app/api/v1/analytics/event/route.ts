import { z } from 'zod';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { withMethods } from '@/libs/api-utils/handler';
import { validateRequest } from '@/libs/api-utils/validate';
import { ok } from '@/libs/api-utils/responses';
import { logEvent } from '@/libs/services/analytics'

const EventSchema = z.object({
  type: z.enum(['page', 'generation_submit', 'generation_done', 'error']),
  payload: z.any().optional()
});

export const POST = withMethods({
  POST: async (req: Request) => {
    try {
      const body = await validateRequest(req, EventSchema);
      const supabase = createServiceSupabaseClient();
      
      // Get user ID if authenticated, null if anonymous
      const { data: { user } } = await supabase.auth.getUser();
      
      await logEvent({ supabase }, { userId: user?.id || null, type: body.type, payload: body.payload })
      
      return ok({ message: 'Event logged' });
    } catch (error) {
      // Analytics should never block user experience
      console.warn('Analytics error:', error);
      return ok({ message: 'Event logged' }); // Always return success
    }
  }
});
