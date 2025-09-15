import { NextRequest, NextResponse } from "next/server";
import { withMethods } from "@/libs/api-utils/methods";
import { withRequestContext } from "@/libs/observability/request";
import { createClient } from "@/libs/supabase/server";
import { getApplicationUrl } from "@/libs/api-utils/url-validation";

export const dynamic = "force-dynamic";

function sanitizeNext(nextUrl: string | null, baseUrl: string) {
  try {
    if (!nextUrl) return new URL("/", baseUrl).toString();
    const u = new URL(nextUrl, baseUrl);
    const base = new URL(baseUrl);
    if (u.origin !== base.origin) return new URL("/", baseUrl).toString();
    return u.toString();
  } catch {
    return new URL("/", baseUrl).toString();
  }
}

export const GET = withMethods(["GET"], withRequestContext(async (req: NextRequest, ctx?: any) => {
  const supabase = createClient();
  try {
    await supabase.auth.signOut();
  } catch (e: any) {
    // Non-fatal; proceed to redirect
    ctx?.logger?.warn?.("auth.signout_error", { message: e?.message });
  }

  const baseUrl = getApplicationUrl(req);
  const nextParam = req.nextUrl.searchParams.get("next");
  const dest = sanitizeNext(nextParam, baseUrl);
  ctx?.logger?.info?.("auth.signout", { next: dest });
  return NextResponse.redirect(dest);
}));

