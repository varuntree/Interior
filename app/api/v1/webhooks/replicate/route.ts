// app/api/v1/webhooks/replicate/route.ts
import { NextRequest } from 'next/server';
import { withMethods } from '@/libs/api-utils/methods';
import { ok, fail } from '@/libs/api-utils/responses';
import { createAdminClient } from '@/libs/supabase/admin';
import { handleReplicateWebhook } from '@/libs/services/generation_webhooks';
import { env } from '@/libs/env';
import { createHmac } from 'crypto';
import { logger } from '@/libs/observability/logger'
import { REPLICATE_SIGNATURE_HEADER } from '@/libs/services/providers/constants'

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
      // Replicate uses header "X-Replicate-Signature" with value "sha256=<hex>"
      const headerName = REPLICATE_SIGNATURE_HEADER;
      const fallbackHeader = 'x-webhook-signature'; // backward-compat if needed
      const signature = req.headers.get(headerName) || req.headers.get(fallbackHeader);
      if (!signature || !verifyWebhookSignature(body, signature, env.server.REPLICATE_WEBHOOK_SECRET)) {
        console.error('Invalid webhook signature');
        return fail(401, 'UNAUTHORIZED', 'Invalid webhook signature');
      }
    }
    
    const payload: ReplicateWebhookPayload = JSON.parse(body);
    const { id: predictionId, status } = payload;

    logger.info('webhook_received', { predictionId, status })

    const supabase = createAdminClient();
    await handleReplicateWebhook({ supabase }, payload)

    const res = ok({ 
      message: 'Webhook processed successfully',
      predictionId,
      status 
    });
    return res
  } catch (error: any) {
    logger.error('webhook_error', { message: error?.message })
    
    // Return 200 to prevent Replicate from retrying
    // Log the error but don't fail the webhook
    return ok({ 
      message: 'Webhook received but processing failed',
      error: error.message 
    });
  }
});

// handling moved into services/generation_webhooks

// Webhook signature verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Expected format: "sha256=<hex>"
    const [algo, providedHex] = signature.split('=');
    if (algo !== 'sha256' || !providedHex) return false;

    const expectedHex = createHmac('sha256', secret).update(payload, 'utf8').digest('hex');

    // Constant-time comparison on hex strings
    if (providedHex.length !== expectedHex.length) return false;
    let mismatch = 0;
    for (let i = 0; i < providedHex.length; i++) {
      mismatch |= providedHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    }
    return mismatch === 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
