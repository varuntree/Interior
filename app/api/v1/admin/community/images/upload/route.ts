import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { uploadImages } from '@/libs/services/community_images_admin'

export const dynamic = 'force-dynamic'

async function handlePOST(req: Request) {
  try {
    const supabase = createServiceSupabaseClient()
    const form = await req.formData()
    const files: File[] = []
    const entries = Array.from(form.entries())
    for (const [, value] of entries) {
      if (value instanceof File && value.size > 0) files.push(value)
    }
    if (files.length === 0) return fail(400, 'VALIDATION_ERROR', 'No files provided')

    const items = await uploadImages({ supabase }, { files })
    return ok({ items })
  } catch (err: any) {
    if (err?.message === 'FORBIDDEN') return fail(403, 'FORBIDDEN', 'Admin access required')
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Upload failed')
  }
}

export const POST = withMethods(['POST'], handlePOST as any)
