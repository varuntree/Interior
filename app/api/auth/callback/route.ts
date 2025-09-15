import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { getApplicationUrl } from "@/libs/api-utils/url-validation";
import config from "@/config";
import runtimeConfig from "@/libs/app-config/runtime";
import { startCheckoutService } from "@/libs/services/billing";
import { logger } from "@/libs/observability/logger";

export const dynamic = "force-dynamic";

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Build base URL and origin for validation
  const baseUrl = getApplicationUrl(req);
  const origin = new URL(baseUrl).origin;

  // Attempt post-login immediate checkout if priceId is present and valid (server computes URLs)
  const priceId = requestUrl.searchParams.get('priceId') || undefined;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    if (user && priceId) {
      // Validate plan from config (marketing) and runtime (limits)
      const cfgPlan = config.stripe.plans.find((p) => p.priceId === priceId);
      const rtPlan = runtimeConfig.plans[priceId as keyof typeof runtimeConfig.plans];
      if (cfgPlan && rtPlan) {
        // Compute URLs server-side
        const successUrl = new URL('/dashboard/settings?success=true', baseUrl).toString();
        // When priceId present, assume pricing flow → cancel to marketing pricing section
        const cancelUrl = new URL('/#pricing', baseUrl).toString();
        const result = await startCheckoutService(supabase, {
          userId: user.id,
          priceId,
          mode: 'subscription',
          successUrl,
          cancelUrl,
        });
        return NextResponse.redirect(result.url);
      }
    }
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : 'unknown_error';
    logger.error('billing.checkout_error', { userId: user?.id, priceId, mode: 'subscription', message: msg });
    // Heuristic for Stripe mode/customer mismatch to aid debugging in future
    const isModeMismatch = /similar object exists in test mode/i.test(msg) || /No such customer/i.test(msg);
    const errCode = isModeMismatch ? 'mode_mismatch' : 'checkout_failed';
    const redirectUrl = new URL('/#pricing', baseUrl);
    redirectUrl.searchParams.set('billing_error', errCode);
    return NextResponse.redirect(redirectUrl.toString());
  }

  // Default: redirect to dashboard
  return NextResponse.redirect(baseUrl + config.auth.callbackUrl);
}
