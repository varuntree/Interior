// app/api/v1/webhooks/replicate/route.ts
import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';
import { withMethods } from '@/libs/api-utils/methods';
import { ok, fail } from '@/libs/api-utils/responses';
import { createAdminClient } from '@/libs/supabase/admin';
import { handleReplicateWebhook } from '@/libs/services/generation_webhooks';
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
    const { id: predictionId, status } = payload;

    console.log(`Webhook received for prediction ${predictionId}: ${status}`);

    const supabase = createAdminClient();
    await handleReplicateWebhook({ supabase }, payload)

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

// handling moved into services/generation_webhooks

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
