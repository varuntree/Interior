import config from "@/config";
import { createCheckout, createCustomerPortal, findCheckoutSession } from "@/libs/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileById, getProfileByEmail, setBillingByUserId, setAccessByCustomerId } from "@/libs/repositories/profiles";

export async function startCheckoutService(db: SupabaseClient, args: {
  userId: string;
  priceId: string;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
}) {
  const profile = await getProfileById(db, args.userId);
  const url = await createCheckout({
    priceId: args.priceId,
    mode: args.mode,
    successUrl: args.successUrl,
    cancelUrl: args.cancelUrl,
    clientReferenceId: args.userId,
    user: {
      email: profile?.email ?? undefined,
      customerId: profile?.customer_id ?? undefined,
    },
  });
  if (!url) throw new Error("Failed to create Stripe Checkout Session");
  return { url };
}

export async function openCustomerPortalService(db: SupabaseClient, args: {
  userId: string;
  returnUrl: string;
}) {
  const profile = await getProfileById(db, args.userId);
  if (!profile?.customer_id) {
    throw new Error("You don't have a billing account yet. Make a purchase first.");
  }
  const url = await createCustomerPortal({
    customerId: profile.customer_id,
    returnUrl: args.returnUrl,
  });
  return { url };
}

/**
 * Handle Stripe webhook events (admin client should be passed in).
 * This function updates profiles and access flags according to the event.
 */
export async function handleStripeWebhookService(adminDb: SupabaseClient, event: any) {
  switch (event.type) {
    case "checkout.session.completed": {
      const stripeObject = event.data.object;
      const session = await findCheckoutSession(stripeObject.id);
      const customerId = session?.customer as string | null;
      const priceId = session?.line_items?.data?.[0]?.price?.id ?? null;
      const userId = stripeObject.client_reference_id as string | null;
      const customerEmail = (session?.customer_details?.email ||
                             stripeObject.customer_details?.email) as string | undefined;

      // Validate plan from config
      const plan = config.stripe.plans.find((p) => p.priceId === priceId);
      if (!plan) return;

      // Find user (prefer client_reference_id; fallback to email)
      let targetUserId = userId;
      if (!targetUserId && customerEmail) {
        try {
          const profile = await getProfileByEmail(adminDb, customerEmail);
          targetUserId = profile?.id;
        } catch {
          // ignore: might not exist yet
        }
      }
      if (!targetUserId) return;

      await setBillingByUserId(adminDb, {
        userId: targetUserId,
        customerId: customerId ?? null,
        priceId: priceId ?? null,
        hasAccess: true,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const stripeObject = event.data.object;
      const subscription = stripeObject; // already contains customer
      await setAccessByCustomerId(adminDb, {
        customerId: String(subscription.customer),
        hasAccess: false,
      });
      break;
    }

    case "invoice.paid": {
      const stripeObject = event.data.object;
      const priceId = stripeObject.lines.data[0]?.price?.id;
      const customerId = stripeObject.customer as string;
      // (Optional) ensure invoice price matches the subscription plan in DB
      // If you want to enforce same plan, you can read the profile and compare here
      await setAccessByCustomerId(adminDb, {
        customerId,
        hasAccess: true,
      });
      break;
    }

    // Other events can be handled later
    default:
      break;
  }
}