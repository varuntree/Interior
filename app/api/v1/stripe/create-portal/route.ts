import { z } from "zod";
import { withMethods } from "@/libs/api-utils/methods";
import { ok, fail } from "@/libs/api-utils/responses";
import { validate } from "@/libs/api-utils/validate";
import { createClient } from "@/libs/supabase/server";
import { openCustomerPortalService } from "@/libs/services/billing";
import { withRequestContext } from '@/libs/observability/request'

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  returnUrl: z.string().url(),
});

export const POST = withMethods(['POST'], withRequestContext(async (req: Request, ctx?: { logger?: any }) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(401, 'UNAUTHORIZED', 'You must be logged in to view billing information.');

    const body = await req.json().catch(() => ({}));
    const v = validate(BodySchema, body);
    if ("res" in v) return v.res;

    try {
      const result = await openCustomerPortalService(supabase, {
        userId: user.id,
        returnUrl: v.data.returnUrl,
      });
      ctx?.logger?.info?.('billing.portal.opened', { userId: user.id })
      return ok(result);
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : 'unknown_error';
      const isNoCustomer = /No such customer/i.test(msg) || /customer.*not.*found/i.test(msg);
      ctx?.logger?.error?.('billing.portal_error', { message: msg, userId: user.id })
      if (isNoCustomer) {
        return fail(400, 'BILLING_NO_CUSTOMER', 'No billing account found for the current environment. Try starting checkout to create one.');
      }
      return fail(500, 'BILLING_ERROR', 'Failed to open billing portal')
    }
}));
