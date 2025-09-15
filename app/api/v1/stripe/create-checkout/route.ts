import { z } from "zod";
import { withMethods } from "@/libs/api-utils/methods";
import { ok, fail } from "@/libs/api-utils/responses";
import { validate } from "@/libs/api-utils/validate";
import { createClient } from "@/libs/supabase/server";
import { startCheckoutService } from "@/libs/services/billing";
import { withRequestContext } from '@/libs/observability/request'
import config from '@/config'
import runtimeConfig from '@/libs/app-config/runtime'
import { getApplicationUrl } from '@/libs/api-utils/url-validation'

export const dynamic = "force-dynamic";

// Accept only priceId officially; allow unknown extra fields to avoid breaking older clients.
const BodySchema = z.object({
  priceId: z.string().min(1),
}).passthrough();

export const POST = withMethods(['POST'], withRequestContext(async (req: Request, ctx?: { logger?: any }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(401, 'UNAUTHORIZED', 'You must be logged in to checkout.');

    const body = await req.json().catch(() => ({}));
    const v = validate(BodySchema, body);
    if ("res" in v) return v.res;

    const { priceId } = v.data as { priceId: string };

    // Validate plan against config and runtime config
    const cfgPlan = config.stripe.plans.find(p => p.priceId === priceId);
    const rtPlan = runtimeConfig.plans[priceId as keyof typeof runtimeConfig.plans];
    if (!cfgPlan || !rtPlan) {
      return fail(400, 'BILLING_INVALID_PLAN', 'Invalid or unsupported plan');
    }

    // Compute URLs server-side; ignore client-provided URLs.
    const baseUrl = getApplicationUrl(req as any);
    const referer = (req.headers.get('referer') || '');
    const successUrl = new URL('/dashboard/settings?success=true', baseUrl).toString();
    // If the request originates from marketing/pricing, send cancel back to pricing; otherwise dashboard
    const cancelPath = referer.includes('/#pricing') ? '/#pricing' : '/dashboard';
    const cancelUrl = new URL(cancelPath, baseUrl).toString();

    try {
      const result = await startCheckoutService(supabase, {
        userId: user.id,
        priceId,
        mode: 'subscription',
        successUrl,
        cancelUrl,
      });
      ctx?.logger?.info?.('billing.checkout.started', { userId: user.id, priceId, mode: 'subscription' })
      return ok(result);
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : ''
      ctx?.logger?.error?.('billing.checkout_error', { message: msg, requestId: (ctx as any)?.requestId, priceId })
      if (/similar object exists in test mode/i.test(msg) || /No such price/i.test(msg)) {
        return fail(400, 'BILLING_ENV_MISMATCH', 'Stripe key and priceId are from different modes (test vs live). Use matching Stripe keys and price IDs.');
      }
      return fail(500, 'BILLING_ERROR', 'Failed to start checkout')
    }
}));
