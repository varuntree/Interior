import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/libs/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Narrow redirect logic only for HTML navigations to public entry points
  const { pathname } = request.nextUrl;
  const isGet = request.method === "GET";
  const accept = request.headers.get("accept") || "";
  const isHtml = accept.includes("text/html");
  const isPublicEntry = pathname === "/" || pathname === "/signin";

  if (isGet && isHtml && isPublicEntry) {
    // Perform a lightweight session refresh and user check here to avoid jitter on landing/signin
    const cookiesToSet: Array<{ name: string; value: string; options: any }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach((c) => cookiesToSet.push(c));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Build the final response (redirect or continue) and apply any cookie updates
    if (user) {
      const redirectUrl = new URL("/dashboard", request.url);
      const res = NextResponse.redirect(redirectUrl);
      cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      return res;
    }

    const res = NextResponse.next({ request });
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  }

  // Default behavior for all other requests: refresh session as before
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhook/.*|api/v1/webhooks/.*).*)",
  ],
};
