import { withMethods } from "@/libs/api-utils/methods";
import { ok, fail } from "@/libs/api-utils/responses";
import { CACHE_CONFIGS } from '@/libs/api-utils/cache';
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic"; // never cache user session

export const GET = withMethods(['GET'], async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(401, 'UNAUTHORIZED', 'Not signed in');
    // Return a minimal shape only (no secrets)
    return ok({ id: user.id, email: user.email, createdAt: user.created_at }, undefined, CACHE_CONFIGS.AUTH);
});
