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
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = 'force-dynamic';

// Replicate webhook payload interface
interface ReplicateWebhookPayload {
  id: string; // prediction_id
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  // google/nano-banana returns a single URL string; legacy models may return array
  output?: string | string[] | null;
  error?: string | null;
  logs?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export const POST = withMethods(['POST'], withRequestContext(async (req: NextRequest, ctx?: { logger?: any }) => {
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
        ctx?.logger?.error?.('webhook.signature_invalid')
        return fail(401, 'UNAUTHORIZED', 'Invalid webhook signature');
      }
    }
    
    const payload: ReplicateWebhookPayload = JSON.parse(body);
    const { id: predictionId, status } = payload;

    ctx?.logger?.info?.('webhook.received', { predictionId, status })

    const supabase = createAdminClient();
    await handleReplicateWebhook({ supabase }, payload)
    ctx?.logger?.info?.('webhook.processed', { predictionId, status })

    const res = ok({ 
      message: 'Webhook processed successfully',
      predictionId,
      status 
    });
    return res
  } catch (error: any) {
    ctx?.logger?.error?.('webhook.error', { message: error?.message })
    
    // Return 200 to prevent Replicate from retrying
    // Log the error but don't fail the webhook
    return ok({ 
      message: 'Webhook received but processing failed',
      error: error.message 
    });
  }
}));

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
  } catch (error: any) {
    logger.error('webhook.signature_error', { message: error?.message })
    return false;
  }
}
