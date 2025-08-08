import { withMethods } from "@/libs/api-utils/handler";
import { ok, unauthorized } from "@/libs/api-utils/responses";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic"; // never cache user session

export const GET = withMethods({
  GET: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized("Not signed in");
    // Return a minimal shape only (no secrets)
    return ok({ id: user.id, email: user.email });
  }
});