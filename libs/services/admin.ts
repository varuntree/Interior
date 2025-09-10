import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/libs/env'

export async function checkAdminStatus(ctx: { supabase: SupabaseClient }): Promise<{ isAdmin: boolean }> {
  // Simple allowlist-based admin check using server env ADMIN_EMAILS
  const { data: { user } } = await ctx.supabase.auth.getUser()
  if (!user?.email) return { isAdmin: false }

  const allow = (env.server.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const isAdmin = allow.includes(user.email.toLowerCase())
  return { isAdmin }
}

export async function bootstrapAdmin(
  ctx: { supabase: SupabaseClient },
  args: { allowlistEmails: string[]; userEmail: string; userId: string }
): Promise<{ isAdmin: boolean; ensured: boolean }> {
  const allow = args.allowlistEmails.map((s) => s.toLowerCase())
  const isAdmin = allow.includes(args.userEmail.toLowerCase())
  return { isAdmin, ensured: false }
}
