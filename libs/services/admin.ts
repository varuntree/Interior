import type { SupabaseClient } from '@supabase/supabase-js'

export async function checkAdminStatus(ctx: { supabase: SupabaseClient }): Promise<{ isAdmin: boolean }> {
  // Minimal stub to satisfy typechecking during baseline setup.
  // Implement proper role checks later (e.g., profiles.role === 'admin').
  return { isAdmin: false }
}

export async function bootstrapAdmin(
  ctx: { supabase: SupabaseClient },
  args: { allowlistEmails: string[]; userEmail: string; userId: string }
): Promise<{ isAdmin: boolean; ensured: boolean }> {
  // Placeholder: only allowlisted users would be granted admin in a real implementation.
  const isAdmin = args.allowlistEmails.includes(args.userEmail)
  return { isAdmin, ensured: false }
}
