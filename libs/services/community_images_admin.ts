import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/libs/supabase/admin'
import { env } from '@/libs/env'

function isAllowlisted(email?: string | null): boolean {
  if (!email) return false
  const allow = (env.server.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes(email.toLowerCase())
}

function buildPublicUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/${path}`
}

export async function uploadImages(
  ctx: { supabase: SupabaseClient },
  args: { files: File[] }
): Promise<Array<{ id: string; image_url: string; created_at: string }>> {
  // Auth + allowlist check with the service client session
  const { data: { user } } = await ctx.supabase.auth.getUser()
  if (!user || !isAllowlisted(user.email)) {
    throw new Error('FORBIDDEN')
  }

  const admin = createAdminClient()
  const results: Array<{ id: string; image_url: string; created_at: string }> = []

  for (const file of args.files) {
    // Basic validation: type and size
    const maxSize = 15 * 1024 * 1024
    if (file.size > maxSize) throw new Error('File too large')
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    const contentType = (file as File).type || 'image/jpeg'
    if (!allowed.includes(contentType)) throw new Error('Invalid file type')

    // Generate path: community/<timestamp>_<random>.ext
    const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const path = `community/${unique}.${ext}`

    // Upload to public bucket with admin client (bypass RLS)
    const { error: upErr } = await admin.storage.from('public').upload(path, file, {
      contentType,
      upsert: false,
    })
    if (upErr && !String(upErr.message || '').toLowerCase().includes('already exists')) {
      throw new Error(`Upload failed: ${upErr.message}`)
    }

    // Insert DB row
    const { data: row, error: insErr } = await admin
      .from('community_images')
      .insert({ image_path: path, is_published: true, order_index: 0 })
      .select('*')
      .single()
    if (insErr || !row) throw new Error(`DB insert failed: ${insErr?.message}`)

    results.push({ id: row.id, image_url: buildPublicUrl(path), created_at: row.created_at })
  }

  return results
}

export async function deleteImages(
  ctx: { supabase: SupabaseClient },
  args: { ids: string[] }
): Promise<{ deleted: number }> {
  // Auth + allowlist check
  const { data: { user } } = await ctx.supabase.auth.getUser()
  if (!user || !isAllowlisted(user.email)) {
    throw new Error('FORBIDDEN')
  }

  const admin = createAdminClient()

  // Fetch rows to identify storage paths
  const { data: rows, error: qErr } = await admin
    .from('community_images')
    .select('id,image_path')
    .in('id', args.ids)
  if (qErr) throw new Error(qErr.message)

  // Delete storage files (best-effort)
  const paths = (rows || []).map((r) => r.image_path).filter(Boolean) as string[]
  if (paths.length > 0) {
    await admin.storage.from('public').remove(paths)
  }

  // Delete rows
  const { error: delErr } = await admin.from('community_images').delete().in('id', args.ids)
  if (delErr) throw new Error(delErr.message)

  return { deleted: args.ids.length }
}

