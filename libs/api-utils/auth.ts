import { createClient } from "@/libs/supabase/server";
import { unauthorized } from "./responses";
import { User } from "@supabase/supabase-js";

export async function requireUser(req: Request): Promise<
  | { user: User; res: null }
  | { user: null; res: Response }
> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, res: unauthorized() };
  return { user, res: null };
}