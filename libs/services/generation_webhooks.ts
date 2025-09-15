import type { SupabaseClient } from '@supabase/supabase-js'
import * as jobsRepo from '@/libs/repositories/generation_jobs'
import { processGenerationAssets } from '@/libs/services/storage/assets'
import { logger } from '@/libs/observability/logger'
import * as failuresRepo from '@/libs/repositories/generation_failures'
import { mapProviderError, mapStorageError } from '@/libs/services/generation/errors'

export interface ReplicateWebhookPayload {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string[] | string | null
  error?: string | null
  logs?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

// Exported for testing: normalize single-string or array output into array of URLs
export function normalizeWebhookOutput(output?: string[] | string | null): string[] {
  if (!output) return []
  return Array.isArray(output) ? output : [output]
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
      // Normalize output into an array of URLs
      const outputs: string[] = normalizeWebhookOutput(output)

      if (!outputs || outputs.length === 0) {
        await jobsRepo.updateJobStatus(supabase, job.id, {
          status: 'failed',
          error: 'No output generated',
          completed_at: new Date().toISOString()
        })
        logger.warn('webhook_no_output', { jobId: job.id, predictionId })
        break
      }
      try {
        await processGenerationAssets(supabase, {
          jobId: job.id,
          predictionId: predictionId,
          outputUrls: outputs.filter((u) => u && typeof u === 'string')
        })
      } catch (err: any) {
        const classification = mapStorageError(err?.message, true)
        try {
          await failuresRepo.createFailure(supabase, {
            job_id: job.id,
            stage: 'storage',
            code: classification.code,
            provider_code: classification.provider_code,
            message: (err?.message || '').slice(0, 500),
            meta: { predictionId, outputs: outputs.length }
          })
        } catch {}
        await jobsRepo.updateJobStatus(supabase, job.id, { status: 'failed', error: 'Asset processing failed', completed_at: new Date().toISOString() })
        logger.error('storage.asset_process_error', { jobId: job.id, predictionId, message: err?.message })
        break
      }
      try {
        const durationMs = Date.now() - new Date(job.created_at).getTime()
        logger.info('webhook_processed', { jobId: job.id, predictionId, outputs: outputs.length, durationMs })
      } catch {
        logger.info('webhook_processed', { jobId: job.id, predictionId, outputs: outputs.length })
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
      const classification = mapProviderError(error || undefined)
      logger.warn('webhook_failed', { jobId: job.id, predictionId, error, class: classification.code, provider_code: classification.provider_code })
      try {
        await failuresRepo.createFailure(supabase, {
          job_id: job.id,
          stage: 'webhook',
          code: classification.code,
          provider_code: classification.provider_code,
          message: (error || '').slice(0, 500),
          meta: { provider_status: status }
        })
      } catch {}
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
