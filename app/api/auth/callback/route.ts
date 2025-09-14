import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { getApplicationUrl } from "@/libs/api-utils/url-validation";
import config from "@/config";

export const dynamic = "force-dynamic";

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  // Use environment-based URL to ensure consistent redirects
  const baseUrl = getApplicationUrl(req);
  return NextResponse.redirect(baseUrl + config.auth.callbackUrl);
}
