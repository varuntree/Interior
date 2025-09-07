// libs/services/generation.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import runtimeConfig from '@/libs/app-config/runtime';
import { buildPrompt, validatePromptParams } from './generation/prompts';
import { moderateContent, moderateImageInputs } from './generation/moderation';
import { uploadGenerationInput } from './storage/uploads';
import * as jobsRepo from '@/libs/repositories/generation_jobs';
import * as usageRepo from '@/libs/repositories/usage';
import { getGenerationProvider } from '@/libs/services/providers/generationProvider';
import type { GenerationRequest } from '@/libs/services/generation/types';
import { randomUUID } from 'crypto';
import { logger } from '@/libs/observability/logger'

export interface GenerationSubmission {
  mode: 'redesign' | 'staging' | 'compose' | 'imagine';
  prompt?: string;
  roomType?: string;
  style?: string;
  input1?: File | Blob;
  input2?: File | Blob;
  idempotencyKey?: string;
}

export interface GenerationResult {
  id: string;
  predictionId?: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  settings: {
    roomType?: string;
    style?: string;
  };
  variants?: Array<{
    index: number;
    url: string;
    thumbUrl?: string;
  }>;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export async function submitGeneration(
  ctx: { supabase: SupabaseClient; userId: string; baseUrl?: string },
  submission: GenerationSubmission
): Promise<GenerationResult> {
  const { supabase, userId, baseUrl } = ctx;

  // Ensure an idempotency key exists (server-side safety)
  if (!submission.idempotencyKey) {
    submission.idempotencyKey = randomUUID();
  }

  // Check for existing idempotency key (app-side idempotency)
  if (submission.idempotencyKey) {
    const existingJob = await jobsRepo.findJobByIdempotencyKey(
      supabase,
      userId,
      submission.idempotencyKey
    );
    if (existingJob) {
      logger.info('generation_idempotent_returned', { ownerId: userId, jobId: existingJob.id })
      return jobToResult(existingJob);
    }
  }

  // Check for in-flight jobs (pre-check for nice UX; DB enforces too)
  const inflightJob = await jobsRepo.findInflightJobForUser(supabase, userId);
  if (inflightJob) {
    logger.warn('generation_inflight_block', { ownerId: userId, jobId: inflightJob.id })
    throw new Error('TOO_MANY_INFLIGHT');
  }

  // Validate mode-specific inputs
  const imageValidation = moderateImageInputs(
    submission.mode,
    submission.input1 ? 'provided' : undefined,
    submission.input2 ? 'provided' : undefined
  );
  if (!imageValidation.allowed) {
    throw new Error(`VALIDATION_ERROR: ${imageValidation.reason}`);
  }

  // Content moderation
  if (submission.prompt) {
    const moderation = moderateContent(submission.prompt);
    if (!moderation.allowed) {
      throw new Error(`VALIDATION_ERROR: ${moderation.reason}`);
    }
  }

  // Build prompt
  const promptParams = {
    mode: submission.mode,
    roomType: submission.roomType,
    style: submission.style,
    userPrompt: submission.prompt
  };

  const promptValidation = validatePromptParams(promptParams);
  if (!promptValidation.valid) {
    throw new Error(`VALIDATION_ERROR: ${promptValidation.error}`);
  }

  const finalPrompt = buildPrompt(promptParams);

  // Check user quota
  const userPlan = await getUserPlan(supabase, userId);
  const remaining = await usageRepo.getRemainingGenerations(supabase, userId, userPlan.monthlyGenerations);
  if (remaining <= 0) {
    throw new Error('LIMIT_EXCEEDED');
  }

  // Handle file uploads
  const signedUrls: string[] = [];
  const inputDbPaths: string[] = [];

  if (submission.input1) {
    const upload1 = await uploadGenerationInput(supabase, {
      userId,
      file: submission.input1,
      contentType: submission.input1 instanceof File ? submission.input1.type : undefined,
      fileName: submission.input1 instanceof File ? submission.input1.name : undefined
    });
    signedUrls.push(upload1.signedUrl);
    inputDbPaths.push(upload1.dbPath);
  }

  if (submission.input2) {
    const upload2 = await uploadGenerationInput(supabase, {
      userId,
      file: submission.input2,
      contentType: submission.input2 instanceof File ? submission.input2.type : undefined,
      fileName: submission.input2 instanceof File ? submission.input2.name : undefined
    });
    signedUrls.push(upload2.signedUrl);
    inputDbPaths.push(upload2.dbPath);
  }

  // Build generation request
  const generationRequest: GenerationRequest = {
    ownerId: userId,
    mode: submission.mode,
    prompt: finalPrompt,
    roomType: submission.roomType,
    style: submission.style,
    input1Path: inputDbPaths[0],
    input2Path: inputDbPaths[1],
    idempotencyKey: submission.idempotencyKey
  };

  // Create job record first to take the in-flight DB lock via partial unique index
  let job
  try {
  job = await jobsRepo.createJob(supabase, {
    owner_id: userId,
    mode: submission.mode,
    room_type: submission.roomType,
    style: submission.style,
    input1_path: inputDbPaths[0],
    input2_path: inputDbPaths[1],
    prompt: finalPrompt,
    status: 'starting',
    idempotency_key: submission.idempotencyKey
  });
  } catch (e: any) {
    // Unique violation from partial unique in-flight index
    if (e?.code === '23505' || /unique constraint/i.test(e?.message || '')) {
      logger.warn('generation_inflight_db_block', { ownerId: userId })
      throw new Error('TOO_MANY_INFLIGHT')
    }
    throw e
  }

  // Submit to provider now that the lock is acquired
  try {
    const provider = getGenerationProvider();
    const webhookUrl = `${(baseUrl || 'http://localhost:3000').replace(/\/$/, '')}${runtimeConfig.replicate.webhookRelativePath}`;
    const submitRes = await provider.submit({
      request: generationRequest,
      signedInputUrls: signedUrls,
      webhookUrl,
    });
    logger.info('generation_submit', { ownerId: userId, jobId: job.id, predictionId: submitRes.predictionId, status: submitRes.status })

    // Attach prediction id to job
    await jobsRepo.updateJobStatus(supabase, job.id, { prediction_id: submitRes.predictionId });
    job.prediction_id = submitRes.predictionId;
  } catch (err: any) {
    // Mark job failed and propagate error
    await jobsRepo.updateJobStatus(supabase, job.id, {
      status: 'failed',
      error: (err?.message || 'Provider submission failed').slice(0, 500),
      completed_at: new Date().toISOString(),
    });
    logger.error('generation_submit_failed', { ownerId: userId, jobId: job.id, message: err?.message })
    throw err;
  }

  // Debit usage (idempotent by meta)
  await usageRepo.debitGeneration(supabase, {
    ownerId: userId,
    jobId: job.id,
    idempotencyKey: submission.idempotencyKey
  });
  logger.info('generation_debit', { ownerId: userId, jobId: job.id })

  return jobToResult(job);
}

export async function getGeneration(
  ctx: { supabase: SupabaseClient; userId: string },
  jobId: string
): Promise<GenerationResult | null> {
  const { supabase, userId } = ctx;

  const job = await jobsRepo.getJobById(supabase, jobId, userId);
  if (!job) return null;

  // If job is non-terminal and stale (>5s), poll Replicate once
  if (shouldPollReplicate(job)) {
    try {
      const provider = getGenerationProvider();
      const statusRes = await provider.getStatus(job.prediction_id!);
      const status = statusRes.status as any;

      if (status !== job.status) {
        await jobsRepo.updateJobStatus(supabase, job.id, {
          status,
          error: statusRes.error || undefined,
          completed_at: statusRes.completedAt || undefined
        });
        logger.info('generation_poll_update', { jobId: job.id, status })
        job.status = status;
        job.error = statusRes.error || undefined;
        job.completed_at = statusRes.completedAt || undefined;
      }
    } catch (error) {
      logger.warn('generation_poll_error', { jobId, message: (error as Error)?.message })
    }
  }

  return jobToResult(job);
}

// Minimal in-process throttle to avoid hammering Replicate on frequent GETs
const _lastPolled: Map<string, number> = new Map(); // predictionId -> epoch ms

function shouldPollReplicate(job: any): boolean {
  if (!job.prediction_id) return false;
  if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'canceled') return false;

  const now = Date.now();
  const createdAt = new Date(job.created_at).getTime();
  const ageSeconds = (now - createdAt) / 1000;
  if (ageSeconds <= 5) return false; // give webhook time first

  const last = _lastPolled.get(job.prediction_id) || 0;
  const secondsSinceLast = (now - last) / 1000;
  if (secondsSinceLast < 10) return false; // throttle to once every 10s per instance

  _lastPolled.set(job.prediction_id, now);
  return true;
}

function jobToResult(job: any): GenerationResult {
  return {
    id: job.id,
    predictionId: job.prediction_id,
    status: job.status,
    settings: {
      roomType: job.room_type,
      style: job.style,
    },
    error: job.error,
    createdAt: job.created_at,
    completedAt: job.completed_at
  };
}

export async function cancelGeneration(
  ctx: { supabase: SupabaseClient; userId: string },
  jobId: string
): Promise<void> {
  const { supabase, userId } = ctx
  const job = await jobsRepo.getJobById(supabase, jobId, userId)
  if (!job) throw new Error('NOT_FOUND')
  if (job.status !== 'starting' && job.status !== 'processing') {
    throw new Error('INVALID_STATE')
  }
  await jobsRepo.updateJobStatus(supabase, jobId, {
    status: 'canceled',
    completed_at: new Date().toISOString()
  })
}

async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<{ monthlyGenerations: number }> {
  // Get user's profile to determine plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('price_id')
    .eq('id', userId)
    .single();

  const priceId = profile?.price_id;
  if (!priceId) {
    // Free tier - return default plan
    return { monthlyGenerations: 20 };
  }

  const plan = runtimeConfig.plans[priceId];
  if (!plan) {
    console.warn(`Unknown price ID: ${priceId}, falling back to free tier`);
    return { monthlyGenerations: 20 };
  }

  return { monthlyGenerations: plan.monthlyGenerations };
}
