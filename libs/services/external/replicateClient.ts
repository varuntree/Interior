// libs/services/external/replicateClient.ts
import Replicate from 'replicate';
import { env } from '@/libs/env';
import runtimeConfig from '@/libs/app-config/runtime';
import { REPLICATE_WEBHOOK_EVENTS } from '@/libs/services/providers/constants'
// Model-specific input types are supplied by adapters; for google, use GoogleNanoBananaInputs

let replicateClient: Replicate | null = null;

function getReplicateClient(): Replicate {
  if (!replicateClient) {
    if (!env.server.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is required but not configured');
    }
    
    replicateClient = new Replicate({
      auth: env.server.REPLICATE_API_TOKEN,
    });
  }
  
  return replicateClient;
}

export interface CreatePredictionParams {
  inputs: ReplicateInputs;
  webhookUrl: string;
  idempotencyKey?: string;
}

export interface PredictionResult {
  id: string;
  status: string;
  urls?: {
    get?: string;
    cancel?: string;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  output?: string[];
  error?: string;
  logs?: string;
}

/**
 * Create a prediction on Replicate.
 *
 * Idempotency: If an idempotencyKey is provided, this function sends it as the
 * HTTP header `Idempotency-Key` so that repeated create attempts (due to
 * client/network retries) do not start multiple predictions upstream. We also
 * maintain app‑side idempotency in our DB (per owner + key) — combining both
 * avoids duplicate jobs and duplicate billing.
 */
export async function createPrediction(params: CreatePredictionParams): Promise<PredictionResult> {
  const client = getReplicateClient();
  const { inputs, webhookUrl, idempotencyKey } = params;

  // Retry configuration
  const maxRetries = 3;
  const baseDelay = 200; // milliseconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let prediction: any;

      if (idempotencyKey) {
        // Use low-level request to attach the Idempotency-Key header.
        // We target the models route since we supply a model name.
        const route = `/models/${runtimeConfig.replicate.model}/predictions`;
        const response = await (client as any).request(route, {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          data: {
            input: inputs,
            webhook: webhookUrl,
            // The low-level request path expects raw strings
            webhook_events_filter: REPLICATE_WEBHOOK_EVENTS as unknown as string[],
          },
        });
        prediction = await response.json();
      } else {
        // Fall back to the high-level SDK helper when no extra headers are needed
        prediction = await client.predictions.create({
          model: runtimeConfig.replicate.model,
          input: inputs,
          webhook: webhookUrl,
          webhook_events_filter: REPLICATE_WEBHOOK_EVENTS as any,
        });
      }

      return {
        id: prediction.id,
        status: prediction.status,
        urls: prediction.urls,
        created_at: prediction.created_at,
        started_at: prediction.started_at,
        completed_at: prediction.completed_at,
        output: prediction.output as string[] | undefined,
        error: prediction.error as string | undefined,
        logs: prediction.logs,
      };
    } catch (error: any) {
      const isRetryableError = 
        error.status === 429 || 
        error.status >= 500 || 
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT';

      if (attempt === maxRetries || !isRetryableError) {
        throw new Error(`Replicate API error after ${attempt} attempts: ${error.message}`);
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unexpected error in createPrediction');
}

export async function getPrediction(predictionId: string): Promise<PredictionResult> {
  const client = getReplicateClient();

  try {
    const prediction = await client.predictions.get(predictionId);

    return {
      id: prediction.id,
      status: prediction.status,
      urls: prediction.urls,
      created_at: prediction.created_at,
      started_at: prediction.started_at,
      completed_at: prediction.completed_at,
      output: prediction.output as string[] | undefined,
      error: prediction.error as string | undefined,
      logs: prediction.logs as string | undefined,
    };
  } catch (error: any) {
    throw new Error(`Failed to get prediction ${predictionId}: ${error.message}`);
  }
}

export async function cancelPrediction(predictionId: string): Promise<PredictionResult> {
  const client = getReplicateClient();

  try {
    const prediction = await client.predictions.cancel(predictionId);

    return {
      id: prediction.id,
      status: prediction.status,
      urls: prediction.urls,
      created_at: prediction.created_at,
      started_at: prediction.started_at,
      completed_at: prediction.completed_at,
      output: prediction.output as string[] | undefined,
      error: prediction.error as string | undefined,
      logs: prediction.logs as string | undefined,
    };
  } catch (error: any) {
    throw new Error(`Failed to cancel prediction ${predictionId}: ${error.message}`);
  }
}
