import type { SupabaseClient } from '@supabase/supabase-js'

export interface GenerationFailureRow {
  id: string
  job_id: string
  stage: string
  code: string
  provider_code?: string | null
  message?: string | null
  meta?: any
  created_at: string
}

export async function createFailure(
  supabase: SupabaseClient,
  row: Omit<GenerationFailureRow, 'id' | 'created_at'>
): Promise<GenerationFailureRow> {
  const { data, error } = await supabase
    .from('generation_failures')
    .insert(row)
    .select()
    .single()
  if (error) throw error
  return data as GenerationFailureRow
}

export async function listByJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<GenerationFailureRow[]> {
  const { data, error } = await supabase
    .from('generation_failures')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as GenerationFailureRow[]
}

