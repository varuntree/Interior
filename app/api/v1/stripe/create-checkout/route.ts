import { z } from "zod";
import { withMethods } from "@/libs/api-utils/methods";
import { ok, fail } from "@/libs/api-utils/responses";
import { validate } from "@/libs/api-utils/validate";
import { createClient } from "@/libs/supabase/server";
import { startCheckoutService } from "@/libs/services/billing";
import { withRequestContext } from '@/libs/observability/request'
import config from '@/config'
import runtimeConfig from '@/libs/app-config/runtime'
// No need to import app URL helper here; derive origin from request URL for stability

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  priceId: z.string().min(1),
  mode: z.enum(["payment", "subscription"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  // couponId?: string (optional for later)
});

export const POST = withMethods(['POST'], withRequestContext(async (req: Request, ctx?: { logger?: any }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(401, 'UNAUTHORIZED', 'You must be logged in to checkout.');

    const body = await req.json().catch(() => ({}));
    const v = validate(BodySchema, body);
    if ("res" in v) return v.res;

    const reqUrl = new URL((req as any)?.url || 'http://localhost:3000');
    const appOrigin = reqUrl.origin;
    const { priceId, mode } = v.data;

    // Validate plan against config and runtime config
    const cfgPlan = config.stripe.plans.find(p => p.priceId === priceId);
    const rtPlan = runtimeConfig.plans[priceId as keyof typeof runtimeConfig.plans];
    if (!cfgPlan || !rtPlan) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid or unsupported plan');
    }

    // Strictly validate success/cancel URLs; enforce same-origin and fall back to safe defaults
    function sanitizeUrl(urlStr: string, fallbackPath: string) {
      try {
        const u = new URL(urlStr);
        if (u.origin !== appOrigin) throw new Error('cross-origin');
        return u.toString();
      } catch {
        const f = new URL(fallbackPath, appOrigin);
        return f.toString();
      }
    }

    const successUrl = sanitizeUrl(
      v.data.successUrl,
      '/dashboard/settings?success=true'
    );
    const cancelUrl = sanitizeUrl(
      v.data.cancelUrl,
      '/'
    );

    try {
      const result = await startCheckoutService(supabase, {
        userId: user.id,
        priceId,
        mode,
        successUrl,
        cancelUrl,
      });
      ctx?.logger?.info?.('billing.checkout.started', { userId: user.id, priceId, mode })
      return ok(result);
    } catch (e: any) {
      ctx?.logger?.error?.('billing.checkout_error', { message: e?.message })
      return fail(500, 'BILLING_ERROR', 'Failed to start checkout')
    }
}));
