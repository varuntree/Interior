import { headers } from "next/headers";
import Stripe from "stripe";
import { withMethods } from "@/libs/api-utils/methods";
import { fail } from "@/libs/api-utils/responses";
import { env } from "@/libs/env";
import { createAdminClient } from "@/libs/supabase/admin";
import { handleStripeWebhookService } from "@/libs/services/billing";
import { withRequestContext } from '@/libs/observability/request'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(env.server.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-08-16",
  typescript: true,
});

export const POST = withMethods(['POST'], withRequestContext(async (req: Request, ctx?: { logger?: any }) => {
    try {
      const body = await req.text();
      const signature = headers().get("stripe-signature") || "";
      const webhookSecret = env.server.STRIPE_WEBHOOK_SECRET || "";
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      ctx?.logger?.info?.('billing.webhook.received', { eventId: (event as any)?.id, type: (event as any)?.type })

      // Admin client (service role)
      const adminDb = createAdminClient();
      await handleStripeWebhookService(adminDb, event);
      ctx?.logger?.info?.('billing.webhook.processed', { eventId: (event as any)?.id })

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (e: any) {
      ctx?.logger?.error?.('billing.webhook.error', { message: e?.message || String(e) })
      return fail(500, 'INTERNAL_ERROR', 'Webhook error');
    }
}));
