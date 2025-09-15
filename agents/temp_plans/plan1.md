 - Scope: Keep marketing static; add server redirects only for logged‑in
  users on public entry points; add a sign‑out endpoint; surface Sign out
  only in Settings page; avoid over‑engineering.
  - Non‑Goals: No DB/schema/config changes; no client‑side auth redirects;
  no new dependencies.

  1) Middleware Redirects (auth → dashboard)

  - File: middleware.ts
  - Action:
      - Keep the existing updateSession(request) call as‑is (refresh
  cookies).
      - Add a narrow redirect block for only full‑page HTML GET requests:
          - Conditions:
              - method === 'GET'
              - Accept header includes text/html
              - pathname is exactly / OR /signin
          - Read session with a lightweight Supabase server client
  (middleware‑safe, same pattern as libs/supabase/middleware.ts) and call
  auth.getUser().
          - If user exists → NextResponse.redirect(new URL('/dashboard',
  request.url)).
          - Else → continue with the response from updateSession.
  - Guardrails:
      - Never run redirect logic for API, asset, or data prefetch requests
  (use the Accept + method checks).
      - Do not change the matcher (it already excludes static assets and
  webhooks).
      - Avoid loops: redirect only from / or /signin to /dashboard;
  dashboard layout already guards unauth → /signin.

  2) Add Sign‑Out Endpoint (server)

  - File: app/api/auth/signout/route.ts
  - Action:
      - GET handler:
          - Create server Supabase client; call auth.signOut(); ignore
  “already signed out” errors.
          - Optional: allow ?next=/path if same‑origin; fallback to /.
          - Redirect with NextResponse.redirect(...).
      - export const dynamic = 'force-dynamic'.
      - Wrap with withRequestContext and log auth.signout.
  - Guardrails:
      - No cookies or tokens echoed; default no-store via helpers or add
  header explicitly.
      - No service‑role usage.

  3) Settings Page: Add “Sign out” UI

  - File: app/(app)/dashboard/settings/page.tsx
  - Action:
      - Add a single “Sign out” button/link that navigates to /api/auth/
  signout.
      - Placement: within the Settings UI (e.g., Profile card footer or a
  small “Account” block at the bottom).
  - Guardrails:
      - No extra state or client logic — just a link/button to the
  endpoint.

  4) Optional Hook Tweak (Consistency)

  - File: hooks/useAuth.ts
  - Action:
      - Change logout() to window.location.href = '/api/auth/signout'.
  - Guardrails:
      - This preserves a single canonical sign‑out path; no other UI
  additions are required.

  5) No Changes To

  - Dashboard server guard (app/(app)/dashboard/layout.tsx) — already
  correct.
  - Marketing pages/layouts — remain static/ISR; no session checks in page
  code.
  - Sign‑in flows — unchanged; middleware will preemptively redirect
  authenticated users away from /signin.

  6) Verification (5-minute smoke)

  - Logged‑out:
      - GET / → marketing loads; CTAs link to /signin.
      - GET /dashboard → server redirects to /signin.
  - Logged‑in:
      - GET / → server redirects to /dashboard (no client “flip”).
      - GET /signin → server redirects to /dashboard.
      - GET /dashboard → renders immediately with no flash.
  - Sign‑out:
      - From Settings, click “Sign out” → redirect to /.
      - Then GET /dashboard → redirects back to /signin.
  - API:
      - /api/v1/auth/me returns 200 when authed, 401 otherwise.
  - SEO:
      - View source/Lighthouse for / as logged‑out; static HTML; no auth
  artifacts.
  - Safety:
      - Confirm API and image requests are never redirected (check network
  tab; only document navigations are redirected).

  7) Rollback Plan

  - Remove the small redirect block from middleware.ts.
  - Remove app/api/auth/signout/route.ts.
  - Remove the Settings “Sign out” button.
  - Optional: revert hook tweak.

  This plan adds only two small server changes (middleware branch + one
  route) and one UI control in Settings. It keeps auth simple, scalable,
and secure without affecting SEO or introducing complexity.