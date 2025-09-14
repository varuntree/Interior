import { withMethods } from "@/libs/api-utils/methods";
import { ok, fail } from "@/libs/api-utils/responses";
import { withRequestContext } from "@/libs/observability/request";
import { createClient } from "@/libs/supabase/server";
import { z } from "zod";
import { getApplicationUrl } from "@/libs/api-utils/url-validation";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

export const POST = withMethods(["POST"], withRequestContext(async (req, ctx) => {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return fail(400, "VALIDATION_ERROR", "Invalid body", parsed.error.flatten());
    }
    const { access_token, refresh_token } = parsed.data;

    // Basic same-origin guard to prevent CSRF for cookie-setting endpoint
    const appUrl = getApplicationUrl(req);
    const appHost = new URL(appUrl).host;
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (!origin && !host) {
      return fail(403, 'FORBIDDEN', 'Missing origin/host');
    }
    if (origin && new URL(origin).host !== appHost) {
      return fail(403, 'FORBIDDEN', 'Cross-origin request not allowed');
    }
    if (!origin && host && host !== appHost) {
      return fail(403, 'FORBIDDEN', 'Cross-origin host not allowed');
    }

    const supabase = createClient();
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) {
      ctx?.logger?.error?.("auth.set_session_error", { message: error.message });
      return fail(401, "UNAUTHORIZED", "Could not set session");
    }

    ctx?.logger?.info?.("auth.set_session", { ok: true });
    return ok({ success: true });
  } catch (e: any) {
    return fail(500, "INTERNAL_ERROR", e?.message ?? "Unexpected error");
  }
}));
