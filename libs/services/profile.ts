import type { SupabaseClient } from '@supabase/supabase-js'
import { getProfileById as repoGetProfileById } from '@/libs/repositories/profiles'

export async function getProfileSettingsService(
  ctx: { supabase: SupabaseClient },
  args: { userId: string }
): Promise<{ name?: string; preferences?: any }> {
  // Placeholder: return empty settings; wire to profiles table later if needed.
  return { }
}

export async function updateProfileSettingsService(
  ctx: { supabase: SupabaseClient },
  args: { userId: string; settings: { name?: string; preferences?: any } }
): Promise<{ success: true }> {
  // Placeholder: accept settings but do not persist in baseline.
  return { success: true }
}

export async function getProfile(
  ctx: { supabase: SupabaseClient },
  userId: string
): Promise<any | null> {
  return repoGetProfileById(ctx.supabase, userId)
}
