import type { SupabaseClient } from '@supabase/supabase-js'

export interface GenerationJob {
  id: string
  owner_id: string
  mode: 'redesign' | 'staging' | 'compose' | 'imagine'
  room_type?: string
  style?: string
  input1_path?: string
  input2_path?: string
  prompt?: string
  prediction_id?: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  error?: string
  idempotency_key?: string
  created_at: string
  completed_at?: string
}

export async function createJob(
  supabase: SupabaseClient,
  job: Omit<GenerationJob, 'id' | 'created_at'>
): Promise<GenerationJob> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .insert(job)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getJobById(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
): Promise<GenerationJob | null> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function findInflightJobForUser(
  supabase: SupabaseClient,
  ownerId: string
): Promise<GenerationJob | null> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('owner_id', ownerId)
    .in('status', ['starting', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export async function updateJobStatus(
  supabase: SupabaseClient,
  id: string,
  patch: {
    status?: GenerationJob['status']
    error?: string
    prediction_id?: string
    completed_at?: string
  }
): Promise<void> {
  const { error } = await supabase
    .from('generation_jobs')
    .update(patch)
    .eq('id', id)
  
  if (error) throw error
}

export async function findJobByIdempotencyKey(
  supabase: SupabaseClient,
  ownerId: string,
  idempotencyKey: string
): Promise<GenerationJob | null> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  
  if (error) throw error
  return data
}

export async function findJobByPredictionId(
  supabase: SupabaseClient,
  predictionId: string
): Promise<GenerationJob | null> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('prediction_id', predictionId)
    .maybeSingle()
  
  if (error) throw error
  return data
}
