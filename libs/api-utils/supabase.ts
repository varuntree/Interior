// libs/api-utils/supabase.ts
import { createClient } from '@/libs/supabase/server'

export function createServiceSupabaseClient() {
  return createClient()
}