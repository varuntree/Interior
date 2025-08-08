import { headers } from "next/headers";
import Stripe from "stripe";
import { withMethods } from "@/libs/api-utils/handler";
import { serverError } from "@/libs/api-utils/responses";
import { env } from "@/libs/env";
import { createAdminClient } from "@/libs/supabase/admin";
import { handleStripeWebhookService } from "@/libs/services/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(env.server.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-08-16",
  typescript: true,
});

export const POST = withMethods({
  POST: async (req: Request) => {
    try {
      const body = await req.text();
      const signature = headers().get("stripe-signature") || "";
      const webhookSecret = env.server.STRIPE_WEBHOOK_SECRET || "";
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

      // Admin client (service role)
      const adminDb = createAdminClient();
      await handleStripeWebhookService(adminDb, event);

      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (e: any) {
      console.error("stripe webhook error:", e?.message || e);
      return serverError("Webhook error");
    }
  }
});