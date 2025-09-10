import { z } from "zod";
import { withMethods } from "@/libs/api-utils/methods";
import { ok, fail } from "@/libs/api-utils/responses";
import { validate } from "@/libs/api-utils/validate";
import { createClient } from "@/libs/supabase/server";
import { startCheckoutService } from "@/libs/services/billing";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  priceId: z.string().min(1),
  mode: z.enum(["payment", "subscription"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  // couponId?: string (optional for later)
});

export const POST = withMethods(['POST'], async (req: Request) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(401, 'UNAUTHORIZED', 'You must be logged in to checkout.');

    const body = await req.json().catch(() => ({}));
    const v = validate(BodySchema, body);
    if ("res" in v) return v.res;

    const { priceId, mode, successUrl, cancelUrl } = v.data;
    const result = await startCheckoutService(supabase, {
      userId: user.id,
      priceId,
      mode,
      successUrl,
      cancelUrl,
    });
    return ok(result);
});
