// app/api/v1/webhooks/replicate/route.ts
import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';
import { withMethods } from '@/libs/api-utils/methods';
import { ok, fail } from '@/libs/api-utils/responses';
import { createAdminClient } from '@/libs/supabase/admin';
import { processGenerationAssets } from '@/libs/services/storage/assets';
import * as jobsRepo from '@/libs/repositories/generation_jobs';
import { env } from '@/libs/env';

export const dynamic = 'force-dynamic';

// Replicate webhook payload interface
interface ReplicateWebhookPayload {
  id: string; // prediction_id
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[] | null;
  error?: string | null;
  logs?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export const POST = withMethods(['POST'], async (req: NextRequest) => {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    
    // Verify webhook signature if secret is configured
    if (env.server.REPLICATE_WEBHOOK_SECRET) {
      const signature = req.headers.get('x-webhook-signature');
      if (!signature || !verifyWebhookSignature(body, signature, env.server.REPLICATE_WEBHOOK_SECRET)) {
        console.error('Invalid webhook signature');
        return fail(401, 'UNAUTHORIZED', 'Invalid webhook signature');
      }
    }
    
    const payload: ReplicateWebhookPayload = JSON.parse(body);
    const { id: predictionId, status, output, error } = payload;

    console.log(`Webhook received for prediction ${predictionId}: ${status}`);

    // Use admin client for webhook operations
    const supabase = createAdminClient();

    // Find the job by prediction ID
    const job = await jobsRepo.findJobByPredictionId(supabase, predictionId);
    if (!job) {
      console.warn(`Job not found for prediction ${predictionId}`);
      return ok({ message: 'Job not found, webhook ignored' });
    }

    // Handle different status updates
    switch (status) {
      case 'succeeded':
        await handleSuccess(supabase, job, output || []);
        break;
        
      case 'failed':
        await handleFailure(supabase, job, error);
        break;
        
      case 'canceled':
        await handleCancellation(supabase, job);
        break;
        
      case 'processing':
        await jobsRepo.updateJobStatus(supabase, job.id, {
          status: 'processing'
        });
        break;
        
      default:
        console.log(`Unhandled status ${status} for prediction ${predictionId}`);
    }

    return ok({ 
      message: 'Webhook processed successfully',
      predictionId,
      status 
    });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Return 200 to prevent Replicate from retrying
    // Log the error but don't fail the webhook
    return ok({ 
      message: 'Webhook received but processing failed',
      error: error.message 
    });
  }
});

async function handleSuccess(
  supabase: any,
  job: any,
  outputUrls: string[]
): Promise<void> {
  if (!outputUrls || outputUrls.length === 0) {
    console.error(`No output URLs for successful job ${job.id}`);
    await jobsRepo.updateJobStatus(supabase, job.id, {
      status: 'failed',
      error: 'No output generated',
      completed_at: new Date().toISOString()
    });
    return;
  }

  try {
    // Process and store assets
    await processGenerationAssets(supabase, {
      jobId: job.id,
      predictionId: job.prediction_id,
      outputUrls: outputUrls.filter(url => url && typeof url === 'string')
    });

    // Mark job as succeeded
    await jobsRepo.updateJobStatus(supabase, job.id, {
      status: 'succeeded',
      completed_at: new Date().toISOString()
    });

    console.log(`Successfully processed assets for job ${job.id}`);
  } catch (error: any) {
    console.error(`Failed to process assets for job ${job.id}:`, error);
    
    await jobsRepo.updateJobStatus(supabase, job.id, {
      status: 'failed',
      error: `Asset processing failed: ${error.message}`,
      completed_at: new Date().toISOString()
    });
  }
}

async function handleFailure(
  supabase: any,
  job: any,
  errorMessage?: string | null
): Promise<void> {
  const normalizedError = errorMessage || 'Generation failed without specific error';
  
  await jobsRepo.updateJobStatus(supabase, job.id, {
    status: 'failed',
    error: normalizedError.slice(0, 500), // Truncate long errors
    completed_at: new Date().toISOString()
  });

  console.log(`Job ${job.id} marked as failed: ${normalizedError}`);
}

async function handleCancellation(
  supabase: any,
  job: any
): Promise<void> {
  await jobsRepo.updateJobStatus(supabase, job.id, {
    status: 'canceled',
    completed_at: new Date().toISOString()
  });

  console.log(`Job ${job.id} marked as canceled`);
}

// Webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Replicate uses HMAC-SHA256 with the format "sha256=<hash>"
    const expectedSignature = `sha256=${createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')}`;
    
    // Use constant-time comparison to prevent timing attacks
    return signature.length === expectedSignature.length &&
      createHmac('sha256', secret)
        .update(signature)
        .digest('hex') === 
      createHmac('sha256', secret)
        .update(expectedSignature)
        .digest('hex');
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}