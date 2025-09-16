import { z } from "zod";
import { withMethods } from "@/libs/api-utils/methods";
import { ok, fail } from "@/libs/api-utils/responses";
import { validate } from "@/libs/api-utils/validate";
import { createClient } from "@/libs/supabase/server";
import { openCustomerPortalService } from "@/libs/services/billing";
import { withRequestContext } from "@/libs/observability/request";
import { getApplicationUrl } from "@/libs/api-utils/url-validation";

export const dynamic = "force-dynamic";

// Body is optional; we compute returnUrl server-side. Accept unknown keys for backward compatibility.
const BodySchema = z.object({
  returnUrl: z.string().url().optional(),
}).passthrough();

export const POST = withMethods(
  ["POST"],
  withRequestContext(async (req: Request, ctx?: { logger?: any }) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return fail(
        401,
        "UNAUTHORIZED",
        "You must be logged in to view billing information."
      );

    // Parse body for backwards compatibility (clients may still send returnUrl)
    const rawBody = await req.json().catch(() => ({}));
    const body = validate(BodySchema, rawBody);
    if (body.ok === false) {
      return body.res;
    }

    const { returnUrl: requestedReturnUrl } = body.data;
    const baseUrl = getApplicationUrl(req as any);
    const computedReturnUrl = new URL("/dashboard/settings", baseUrl).toString();

    if (requestedReturnUrl && requestedReturnUrl !== computedReturnUrl) {
      ctx?.logger?.info?.("billing.portal.return_url_ignored", {
        userId: user.id,
        requestedReturnUrl,
      });
    }

    const returnUrl = computedReturnUrl;

    try {
      const result = await openCustomerPortalService(supabase, {
        userId: user.id,
        returnUrl,
      });
      ctx?.logger?.info?.("billing.portal.opened", { userId: user.id });
      return ok(result);
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : "unknown_error";
      const isNoCustomer =
        /No such customer/i.test(msg) || /customer.*not.*found/i.test(msg);
      ctx?.logger?.error?.("billing.portal_error", {
        message: msg,
        userId: user.id,
        requestId: (ctx as any)?.requestId,
      });
      if (isNoCustomer) {
        return fail(
          400,
          "BILLING_NO_CUSTOMER",
          "No billing account found for the current environment. Try starting checkout to create one."
        );
      }
      return fail(500, "BILLING_ERROR", "Failed to open billing portal");
    }
  })
);
