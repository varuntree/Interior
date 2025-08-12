import { createClient } from "@supabase/supabase-js";
import { env } from "@/libs/env";

export function createAdminClient() {
  if (!env.server.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin client");
  }
  
  return createClient(
    env.public.NEXT_PUBLIC_SUPABASE_URL, 
    env.server.SUPABASE_SERVICE_ROLE_KEY, 
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}