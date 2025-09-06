// libs/services/generation.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import runtimeConfig from '@/libs/app-config/runtime';
import { env } from '@/libs/env';
import { buildPrompt, validatePromptParams } from './generation/prompts';
import { moderateContent, moderateImageInputs } from './generation/moderation';
import { uploadGenerationInput } from './storage/uploads';
import { createPrediction, getPrediction } from './external/replicateClient';
import { toReplicateInputs, buildWebhookUrl, type GenerationRequest } from './external/replicateAdapter';
import * as jobsRepo from '@/libs/repositories/generation_jobs';
import * as usageRepo from '@/libs/repositories/usage';

export interface GenerationSubmission {
  mode: 'redesign' | 'staging' | 'compose' | 'imagine';
  prompt?: string;
  roomType?: string;
  style?: string;
  settings?: {
    aspectRatio?: '1:1' | '3:2' | '2:3';
    quality?: 'auto' | 'low' | 'medium' | 'high';
    variants?: number;
  };
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
    aspectRatio: '1:1' | '3:2' | '2:3';
    quality: 'auto' | 'low' | 'medium' | 'high';
    variants: number;
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

  // Check for existing idempotency key
  if (submission.idempotencyKey) {
    const existingJob = await jobsRepo.findJobByIdempotencyKey(
      supabase,
      userId,
      submission.idempotencyKey
    );
    if (existingJob) {
      return jobToResult(existingJob);
    }
  }

  // Check for in-flight jobs
  const inflightJob = await jobsRepo.findInflightJobForUser(supabase, userId);
  if (inflightJob) {
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
  const settings = {
    aspectRatio: submission.settings?.aspectRatio || runtimeConfig.defaults.aspectRatio,
    quality: submission.settings?.quality || runtimeConfig.defaults.quality,
    variants: Math.min(
      submission.settings?.variants || runtimeConfig.defaults.variants,
      runtimeConfig.limits.maxVariantsPerRequest
    )
  };

  const generationRequest: GenerationRequest = {
    ownerId: userId,
    mode: submission.mode,
    prompt: finalPrompt,
    roomType: submission.roomType,
    style: submission.style,
    settings,
    input1Path: inputDbPaths[0],
    input2Path: inputDbPaths[1],
    idempotencyKey: submission.idempotencyKey
  };

  // Validate OpenAI API key is available
  if (!env.server.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for image generation');
  }

  // Create Replicate prediction
  const replicateInputs = toReplicateInputs(generationRequest, signedUrls, env.server.OPENAI_API_KEY);
  const webhookUrl = buildWebhookUrl(baseUrl || 'http://localhost:3000');

  const prediction = await createPrediction({
    inputs: replicateInputs,
    webhookUrl,
    idempotencyKey: submission.idempotencyKey
  });
  console.log('[generation:submit]', { ownerId: userId, jobPredictionId: prediction.id, status: 'starting' })

  // Create job record
  const job = await jobsRepo.createJob(supabase, {
    owner_id: userId,
    mode: submission.mode,
    room_type: submission.roomType,
    style: submission.style,
    aspect_ratio: settings.aspectRatio,
    quality: settings.quality,
    variants: settings.variants,
    input1_path: inputDbPaths[0],
    input2_path: inputDbPaths[1],
    prompt: finalPrompt,
    prediction_id: prediction.id,
    status: 'starting',
    idempotency_key: submission.idempotencyKey
  });

  // Debit usage
  await usageRepo.debitGeneration(supabase, {
    ownerId: userId,
    jobId: job.id,
    idempotencyKey: submission.idempotencyKey
  });
  console.log('[generation:debit]', { ownerId: userId, jobId: job.id })

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
      const prediction = await getPrediction(job.prediction_id!);
      const status = prediction.status as any;

      if (status !== job.status) {
        await jobsRepo.updateJobStatus(supabase, job.id, {
          status,
          error: prediction.error || undefined,
          completed_at: prediction.completed_at || undefined
        });
        console.log('[generation:poll]', { jobId: job.id, status })
        job.status = status;
        job.error = prediction.error || undefined;
        job.completed_at = prediction.completed_at || undefined;
      }
    } catch (error) {
      console.warn(`Failed to poll Replicate for job ${jobId}:`, error);
    }
  }

  return jobToResult(job);
}

function shouldPollReplicate(job: any): boolean {
  if (!job.prediction_id) return false;
  if (job.status === 'succeeded' || job.status === 'failed' || job.status === 'canceled') return false;

  const now = new Date();
  const createdAt = new Date(job.created_at);
  const ageSeconds = (now.getTime() - createdAt.getTime()) / 1000;

  return ageSeconds > 5; // Poll if older than 5 seconds
}

function jobToResult(job: any): GenerationResult {
  return {
    id: job.id,
    predictionId: job.prediction_id,
    status: job.status,
    settings: {
      roomType: job.room_type,
      style: job.style,
      aspectRatio: job.aspect_ratio,
      quality: job.quality,
      variants: job.variants
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
