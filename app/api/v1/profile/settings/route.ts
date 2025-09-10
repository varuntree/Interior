// no NextRequest/NextResponse imports needed
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase';
import { withMethods } from '@/libs/api-utils/methods';
import { validateRequest } from '@/libs/api-utils/validate';
import { ok, fail } from '@/libs/api-utils/responses';
import { getProfileSettingsService, updateProfileSettingsService } from '@/libs/services/profile';

const UpdateSettingsSchema = z.object({
  name: z.string().optional(),
  preferences: z.any().optional()
});

export const GET = withMethods(['GET'], async () => {
    try {
      const supabase = createServiceSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return fail('UNAUTHORIZED', 'Authentication required', 401);
      }
      
      const settings = await getProfileSettingsService(
        { supabase },
        { userId: user.id }
      );
      
      return ok(settings);
    } catch (error) {
      return fail('INTERNAL_ERROR', 'Failed to get profile settings', 500);
    }
});

export const PATCH = withMethods(['PATCH'], async (req: Request) => {
    try {
      const body = await validateRequest(req, UpdateSettingsSchema);
      const supabase = createServiceSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return fail('UNAUTHORIZED', 'Authentication required', 401);
      }
      
      const settings = await updateProfileSettingsService(
        { supabase },
        { userId: user.id, settings: body }
      );
      
      return ok(settings);
    } catch (error) {
      return fail('INTERNAL_ERROR', 'Failed to update profile settings', 500);
    }
});
