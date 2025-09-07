import { z } from "zod";
import { withMethods } from "@/libs/api-utils/handler";
import { ok, fail } from "@/libs/api-utils/responses";
import { validate } from "@/libs/api-utils/validate";
import { createClient } from "@/libs/supabase/server";
import { openCustomerPortalService } from "@/libs/services/billing";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  returnUrl: z.string().url(),
});

export const POST = withMethods({
  POST: async (req: Request) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail(401, 'UNAUTHORIZED', 'You must be logged in to view billing information.');

    const body = await req.json().catch(() => ({}));
    const v = validate(BodySchema, body);
    if ("res" in v) return v.res;

    const result = await openCustomerPortalService(supabase, {
      userId: user.id,
      returnUrl: v.data.returnUrl,
    });
    return ok(result);
  }
});
