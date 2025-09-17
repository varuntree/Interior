import type Stripe from "stripe";
import config from "@/config";
import runtimeConfig from "@/libs/app-config/runtime";
import { createCheckout, createCustomerPortal, findCheckoutSession } from "@/libs/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfileById, getProfileByEmail, setBillingByUserId, setBillingByCustomerId } from "@/libs/repositories/profiles";
import { recordWebhookEventIfNew } from "@/libs/repositories/webhook_events";
import { sendMetaPurchase } from "@/libs/services/external/metaConversions";

export async function startCheckoutService(db: SupabaseClient, args: {
  userId: string;
  priceId: string;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string | undefined>;
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
    metadata: args.metadata,
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

export interface CheckoutSessionSummary {
  amount: number
  currency: string
  planType: 'weekly' | 'monthly' | 'one_time' | 'unknown'
  eventId: string
  subscriptionId?: string | null
  customerEmail?: string
  customerId?: string | null
  priceId?: string | null
  tracking: {
    fbp?: string
    fbc?: string
    ua?: string
    ip?: string
  }
}

export function inferPlanType(price?: Stripe.Price | null): CheckoutSessionSummary['planType'] {
  const nickname = price?.nickname ?? ''
  const recurringInterval = price?.recurring?.interval ?? ''
  if (/week/i.test(nickname) || /week/i.test(recurringInterval)) return 'weekly'
  if (/month/i.test(nickname) || /month/i.test(recurringInterval)) return 'monthly'
  if (price?.type === 'one_time') return 'one_time'
  return 'unknown'
}

export async function getCheckoutSessionSummary(sessionId: string): Promise<CheckoutSessionSummary | null> {
  const session = await findCheckoutSession(sessionId)
  if (!session) return null

  const subscription = session.subscription as Stripe.Subscription | null
  const lineItemPrice = session.line_items?.data?.[0]?.price as Stripe.Price | undefined
  const subscriptionPrice = subscription?.items?.data?.[0]?.price as Stripe.Price | undefined
  const price = subscriptionPrice ?? lineItemPrice ?? null
  const amountCents = price?.unit_amount ?? session.amount_total ?? 0
  const currency = (price?.currency || session.currency || 'aud').toUpperCase()
  const planType = inferPlanType(price)
  const subscriptionId = subscription?.id ?? (typeof session.subscription === 'string' ? session.subscription : null)
  const eventId = subscriptionId ? `sub_${subscriptionId}` : `cs_${session.id}`

  return {
    amount: amountCents / 100,
    currency,
    planType,
    eventId,
    subscriptionId,
    customerEmail: session.customer_details?.email || undefined,
    customerId: (session.customer as string) ?? null,
    priceId: price?.id ?? null,
    tracking: {
      fbp: typeof session.metadata?.fbp === 'string' ? session.metadata?.fbp : undefined,
      fbc: typeof session.metadata?.fbc === 'string' ? session.metadata?.fbc : undefined,
      ua: typeof session.metadata?.ua === 'string' ? session.metadata?.ua : undefined,
      ip: typeof session.metadata?.ip === 'string' ? session.metadata?.ip : undefined,
    },
  }
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
  const eventSourceUrlBase = (process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

  switch (event.type) {
    case "checkout.session.completed": {
      const stripeObject = event.data.object as Stripe.Checkout.Session;
      const summary = await getCheckoutSessionSummary(stripeObject.id);
      if (!summary) return;

      const priceId = summary.priceId;
      const userId = stripeObject.client_reference_id as string | null;
      const customerEmail = summary.customerEmail || stripeObject.customer_details?.email || undefined;
      const subscriptionId = summary.subscriptionId || null;
      const customerId = summary.customerId;

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

      if (summary.amount > 0 && eventSourceUrlBase) {
        await sendMetaPurchase({
          eventId: summary.eventId,
          value: summary.amount,
          currency: summary.currency,
          orderId: stripeObject.id,
          planType: summary.planType,
          eventSourceUrl: `${eventSourceUrlBase}/checkout/success`,
          eventTime: stripeObject.created,
          userData: {
            email: customerEmail,
            fbp: summary.tracking.fbp,
            fbc: summary.tracking.fbc,
            clientUserAgent: summary.tracking.ua,
            clientIpAddress: summary.tracking.ip,
          },
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

    case "invoice.payment_succeeded": {
      const stripeObject = event.data.object as Stripe.Invoice;
      const price = stripeObject.lines.data[0]?.price as Stripe.Price | undefined;
      const priceId = price?.id;
      const customerId = stripeObject.customer as string;
      const period = stripeObject.lines.data[0]?.period;
      const cps = period?.start ? new Date(period.start * 1000).toISOString() : undefined;
      const cpe = period?.end ? new Date(period.end * 1000).toISOString() : undefined;

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

      if (stripeObject.billing_reason !== 'subscription_create' && stripeObject.amount_paid && eventSourceUrlBase) {
        await sendMetaPurchase({
          eventId: `inv_${stripeObject.id}`,
          value: (stripeObject.amount_paid ?? 0) / 100,
          currency: (stripeObject.currency || 'AUD').toUpperCase(),
          orderId: stripeObject.id,
          planType: inferPlanType(price ?? null),
          eventSourceUrl: `${eventSourceUrlBase}/checkout/success`,
          eventTime: stripeObject.created,
          userData: {
            email: typeof stripeObject.customer_email === 'string' ? stripeObject.customer_email : undefined,
          },
        })
      }
      break;
    }

    // Other events can be handled later
    default:
      break;
  }
}
