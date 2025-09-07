import type { SupabaseClient } from '@supabase/supabase-js'
import * as jobsRepo from '@/libs/repositories/generation_jobs'
import { processGenerationAssets } from '@/libs/services/storage/assets'
import { logger } from '@/libs/observability/logger'

export interface ReplicateWebhookPayload {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string[] | null
  error?: string | null
  logs?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export async function handleReplicateWebhook(
  ctx: { supabase: SupabaseClient },
  payload: ReplicateWebhookPayload
): Promise<{ predictionId: string; status: string }> {
  const { supabase } = ctx
  const { id: predictionId, status, output, error } = payload

  const job = await jobsRepo.findJobByPredictionId(supabase, predictionId)
  if (!job) {
    logger.warn('webhook_job_not_found', { predictionId, status })
    return { predictionId, status }
  }

  switch (status) {
    case 'succeeded':
      if (!output || output.length === 0) {
        await jobsRepo.updateJobStatus(supabase, job.id, {
          status: 'failed',
          error: 'No output generated',
          completed_at: new Date().toISOString()
        })
        logger.warn('webhook_no_output', { jobId: job.id, predictionId })
        break
      }
      await processGenerationAssets(supabase, {
        jobId: job.id,
        predictionId: predictionId,
        outputUrls: output.filter((u) => u && typeof u === 'string')
      })
      try {
        const durationMs = Date.now() - new Date(job.created_at).getTime()
        logger.info('webhook_processed', { jobId: job.id, predictionId, outputs: output.length, durationMs })
      } catch {
        logger.info('webhook_processed', { jobId: job.id, predictionId, outputs: output.length })
      }
      await jobsRepo.updateJobStatus(supabase, job.id, {
        status: 'succeeded',
        completed_at: new Date().toISOString()
      })
      break
    case 'failed':
      await jobsRepo.updateJobStatus(supabase, job.id, {
        status: 'failed',
        error: (error || 'Generation failed').slice(0, 500),
        completed_at: new Date().toISOString()
      })
      logger.warn('webhook_failed', { jobId: job.id, predictionId, error })
      break
    case 'canceled':
      await jobsRepo.updateJobStatus(supabase, job.id, {
        status: 'canceled',
        completed_at: new Date().toISOString()
      })
      logger.info('webhook_canceled', { jobId: job.id, predictionId })
      break
    case 'processing':
      await jobsRepo.updateJobStatus(supabase, job.id, { status: 'processing' })
      logger.info('webhook_processing', { jobId: job.id, predictionId })
      break
    default:
      // ignore
      break
  }

  return { predictionId, status }
}
