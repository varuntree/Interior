import config from "@/config";
import runtimeConfig from "@/libs/app-config/runtime";
import { createCheckout, createCustomerPortal, findCheckoutSession } from "@/libs/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileById, getProfileByEmail, setBillingByUserId, setAccessByCustomerId, setBillingByCustomerId } from "@/libs/repositories/profiles";
import { recordWebhookEventIfNew } from "@/libs/repositories/webhook_events";

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

export interface PlanDetails {
  id: string
  label: string
  priceAudPerMonth: number
  monthlyGenerations: number
  maxConcurrentJobs: number
  stripePriceId: string
  features: string[]
  isActive: boolean
}

export interface UserBillingInfo {
  customerId?: string
  priceId?: string
  hasAccess: boolean
  plan: PlanDetails
  nextBillingDate?: string
  subscriptionStatus?: string
}

export function getAllAvailablePlans(): PlanDetails[] {
  const configPlans = config.stripe.plans
  
  return configPlans.map(configPlan => {
    const runtimePlan = runtimeConfig.plans[configPlan.priceId]
    
    return {
      id: configPlan.priceId,
      label: runtimePlan?.label || configPlan.name,
      priceAudPerMonth: configPlan.price,
      monthlyGenerations: runtimePlan?.monthlyGenerations || 0,
      maxConcurrentJobs: runtimePlan?.maxConcurrentJobs || 1,
      stripePriceId: configPlan.priceId,
      features: configPlan.features?.map(f => f.name) || [],
      isActive: true
    }
  })
}

export function getPlanByPriceId(priceId: string): PlanDetails | null {
  const configPlan = config.stripe.plans.find(p => p.priceId === priceId)
  if (!configPlan) return null
  
  const runtimePlan = runtimeConfig.plans[priceId]
  if (!runtimePlan) return null
  
  return {
    id: priceId,
    label: runtimePlan.label,
    priceAudPerMonth: configPlan.price,
    monthlyGenerations: runtimePlan.monthlyGenerations,
    maxConcurrentJobs: runtimePlan.maxConcurrentJobs || 1,
    stripePriceId: priceId,
    features: configPlan.features?.map(f => f.name) || [],
    isActive: true
  }
}

export function getFreePlan(): PlanDetails {
  return {
    id: 'free',
    label: 'Free',
    priceAudPerMonth: 0,
    monthlyGenerations: 20,
    maxConcurrentJobs: 1,
    stripePriceId: '',
    features: ['20 generations per month', '1 concurrent job', 'Basic support'],
    isActive: true
  }
}

export async function getUserBillingInfo(
  ctx: { supabase: SupabaseClient },
  userId: string
): Promise<UserBillingInfo> {
  const profile = await getProfileById(ctx.supabase, userId)
  
  if (!profile) {
    throw new Error('User profile not found')
  }

  let plan: PlanDetails
  if (profile.price_id) {
    plan = getPlanByPriceId(profile.price_id) || getFreePlan()
  } else {
    plan = getFreePlan()
  }

  return {
    customerId: profile.customer_id || undefined,
    priceId: profile.price_id || undefined,
    hasAccess: profile.has_access || false,
    plan,
    // TODO: Add subscription status and next billing date from Stripe
  }
}

export function calculateUpgradeDowngrade(
  currentPriceId: string | null,
  targetPriceId: string
): {
  isUpgrade: boolean
  isDowngrade: boolean
  priceDifference: number
  currentPlan: PlanDetails
  targetPlan: PlanDetails
} {
  const currentPlan = currentPriceId ? getPlanByPriceId(currentPriceId) : getFreePlan()
  const targetPlan = getPlanByPriceId(targetPriceId)
  
  if (!currentPlan || !targetPlan) {
    throw new Error('Invalid plan configuration')
  }

  const priceDifference = targetPlan.priceAudPerMonth - currentPlan.priceAudPerMonth
  
  return {
    isUpgrade: priceDifference > 0,
    isDowngrade: priceDifference < 0,
    priceDifference: Math.abs(priceDifference),
    currentPlan,
    targetPlan
  }
}

export function formatPlanFeatures(plan: PlanDetails): string[] {
  const features = [...plan.features]
  
  // Add generated features
  if (plan.monthlyGenerations > 0) {
    features.unshift(`${plan.monthlyGenerations} generations per month`)
  }
  
  if (plan.maxConcurrentJobs > 1) {
    features.push(`${plan.maxConcurrentJobs} concurrent jobs`)
  }
  
  return features
}

export function isValidPlanForUpgrade(currentPriceId: string | null, targetPriceId: string): boolean {
  try {
    const comparison = calculateUpgradeDowngrade(currentPriceId, targetPriceId)
    return comparison.isUpgrade || comparison.isDowngrade
  } catch {
    return false
  }
}

export function getCurrentBillingPeriod(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  return { start, end }
}

/**
 * Handle Stripe webhook events (admin client should be passed in).
 * This function updates profiles and access flags according to the event.
 */
export async function handleStripeWebhookService(adminDb: SupabaseClient, event: any) {
  // Idempotency: de-duplicate by event.id
  try {
    const isNew = await recordWebhookEventIfNew(adminDb, 'stripe', event?.id as string, event)
    if (!isNew) {
      return
    }
  } catch (e) {
    // If de-dup check fails, proceed cautiously (better to process once than drop)
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const stripeObject = event.data.object;
      const session = await findCheckoutSession(stripeObject.id);
      const customerId = session?.customer as string | null;
      const priceId = session?.line_items?.data?.[0]?.price?.id ?? null;
      const userId = stripeObject.client_reference_id as string | null;
      const customerEmail = (session?.customer_details?.email ||
                             stripeObject.customer_details?.email) as string | undefined;
      const subscriptionId = (session?.subscription as string) || null;

      // Validate plan from both config and runtime config
      const configPlan = config.stripe.plans.find((p) => p.priceId === priceId);
      const runtimePlan = priceId ? runtimeConfig.plans[priceId] : null;
      if (!configPlan || !runtimePlan) return;

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
      if (subscriptionId) {
        await setBillingByCustomerId(adminDb, {
          customerId: customerId || '',
          subscriptionId,
        })
      }
      break;
    }

    case "customer.subscription.updated": {
      const stripeObject = event.data.object;
      const customerId = stripeObject.customer as string;
      const priceId = stripeObject.items?.data?.[0]?.price?.id;
      const subscriptionId = stripeObject.id as string;
      const cps = stripeObject.current_period_start ? new Date(stripeObject.current_period_start * 1000).toISOString() : undefined;
      const cpe = stripeObject.current_period_end ? new Date(stripeObject.current_period_end * 1000).toISOString() : undefined;
      const status: string = stripeObject.status;
      const hasAccess = status === 'active' || status === 'trialing';
      
      // Update the user's plan
      if (priceId && runtimeConfig.plans[priceId]) {
        await setBillingByCustomerId(adminDb, {
          customerId,
          priceId,
          hasAccess,
          subscriptionId,
          currentPeriodStart: cps || null,
          currentPeriodEnd: cpe || null,
        })
      } else {
        // Still update access/periods even if plan unknown
        await setBillingByCustomerId(adminDb, {
          customerId,
          hasAccess,
          subscriptionId,
          currentPeriodStart: cps || null,
          currentPeriodEnd: cpe || null,
        })
      }
      break;
    }

    case "customer.subscription.deleted": {
      const stripeObject = event.data.object;
      const subscription = stripeObject; // already contains customer
      await setBillingByCustomerId(adminDb, {
        customerId: String(subscription.customer),
        hasAccess: false,
        currentPeriodEnd: new Date().toISOString(),
      });
      break;
    }

    case "invoice.paid": {
      const stripeObject = event.data.object;
      const priceId = stripeObject.lines.data[0]?.price?.id;
      const customerId = stripeObject.customer as string;
      const period = stripeObject.lines.data[0]?.period;
      const cps = period?.start ? new Date(period.start * 1000).toISOString() : undefined;
      const cpe = period?.end ? new Date(period.end * 1000).toISOString() : undefined;
      
      // Validate plan exists in runtime config
      if (priceId && runtimeConfig.plans[priceId]) {
        await setBillingByCustomerId(adminDb, {
          customerId,
          priceId,
          hasAccess: true,
          currentPeriodStart: cps || null,
          currentPeriodEnd: cpe || null,
        })
      } else {
        await setBillingByCustomerId(adminDb, {
          customerId,
          hasAccess: true,
          currentPeriodStart: cps || null,
          currentPeriodEnd: cpe || null,
        })
      }
      break;
    }

    case "invoice.payment_failed": {
      const stripeObject = event.data.object;
      const customerId = stripeObject.customer as string;
      
      // Temporarily disable access on payment failure
      // In production, you might want more sophisticated handling
      await setBillingByCustomerId(adminDb, {
        customerId,
        hasAccess: false,
      });
      break;
    }

    // Other events can be handled later
    default:
      break;
  }
}
