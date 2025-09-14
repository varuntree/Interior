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

  // Attempt post-login immediate checkout if params are present and valid
  const priceId = requestUrl.searchParams.get('priceId') || undefined;
  const mode = (requestUrl.searchParams.get('mode') as 'payment' | 'subscription') || undefined;
  const successUrlParam = requestUrl.searchParams.get('successUrl') || undefined;
  const cancelUrlParam = requestUrl.searchParams.get('cancelUrl') || undefined;

  // Helper to sanitize URLs to same-origin or fallback
  const sanitize = (urlStr: string | undefined, fallbackPath: string) => {
    try {
      if (!urlStr) throw new Error('missing');
      const u = new URL(urlStr);
      if (u.origin !== origin) throw new Error('cross-origin');
      return u.toString();
    } catch {
      return new URL(fallbackPath, baseUrl).toString();
    }
  };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    if (user && priceId && mode) {
      // Validate plan from config (marketing) and runtime (limits)
      const cfgPlan = config.stripe.plans.find((p) => p.priceId === priceId);
      const rtPlan = runtimeConfig.plans[priceId as keyof typeof runtimeConfig.plans];
      if (cfgPlan && rtPlan) {
        const successUrl = sanitize(successUrlParam, '/dashboard/settings?success=true');
        const cancelUrl = sanitize(cancelUrlParam, '/');
        const result = await startCheckoutService(supabase, {
          userId: user.id,
          priceId,
          mode,
          successUrl,
          cancelUrl,
        });
        return NextResponse.redirect(result.url);
      }
    }
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : 'unknown_error';
    logger.error('billing.checkout_error', { userId: user?.id, priceId, mode, message: msg });
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
