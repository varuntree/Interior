0) Purpose
Minimal, practical steps to run locally and in prod, with the fewest moving parts. Covers env setup, Supabase, Stripe, Replicate, migrations, and smoke checks.

1) Prereqs
Node 18+

npm (we use npm only)

A Supabase project

A Stripe account (for checkout/portal)

A Replicate account/token

2) Environment variables
Copy .env.example → .env.local, then fill:

makefile
Copy
# --- Resend (optional for now) ---
RESEND_API_KEY=

# --- Supabase (required) ---
NEXT_PUBLIC_SUPABASE_URL=              # from Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # anon key
SUPABASE_SERVICE_ROLE_KEY=             # needed only for webhooks/server tasks

# --- Stripe (required for paid plans) ---
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=                 # from Stripe CLI or dashboard webhook

# --- Replicate (required for generation) ---
REPLICATE_API_TOKEN=                   # Personal token
# Optional: override model (we default in runtime config)
# REPLICATE_OWNER=google
# REPLICATE_MODEL=nano-banana
We’ll reference REPLICATE_API_TOKEN in the Replicate client (service). If the env helper doesn’t include it yet, add server.REPLICATE_API_TOKEN to libs/env.

3) Install & run (dev)
bash
Copy
npm install
npm run dev
Visit http://localhost:3000.

4) Supabase setup
4.1 Create project
Create a Supabase project and copy URL/keys into .env.local.

4.2 Apply migrations
Use the Supabase SQL editor to run, in order:

migrations/phase1/001_create_profiles.sql

migrations/phase1/002_profiles_policies.sql

migrations/phase1/003_profiles_trigger.sql

migrations/phase1/004_storage_buckets.sql

These are idempotent. Ensure RLS is enabled.

4.3 Buckets
public (read‑anyone, auth write)

private (owner‑scoped). Already created by migration.

5) Auth & dashboard guard
Sign in using your configured provider (Google/magic link based on your UI).

/dashboard is protected by app/(app)/dashboard/layout.tsx; unauthenticated users are redirected to /signin.

6) Stripe (dev)
6.1 Plans
Use the existing config.ts.stripe.plans[*] priceIds (dev IDs are in place).

Make sure those IDs exist in your Stripe test mode.

6.2 Webhook (local)
Install Stripe CLI and run:

bash
Copy
stripe login
stripe listen --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted \
  --forward-to http://localhost:3000/api/webhook/stripe
Copy the printed signing secret into .env.local as STRIPE_WEBHOOK_SECRET.

Our legacy path /api/webhook/stripe re‑exports from /api/v1/webhooks/stripe/route. Keep it that way.

7) Replicate
7.1 Token
Set REPLICATE_API_TOKEN in .env.local.

7.2 Webhook URL
Runtime config defaults to /api/v1/replicate/webhook.

In dev, Replicate must reach your machine:

Use ngrok http 3000 (or Vercel preview).

Put the public URL + /api/v1/replicate/webhook into the webhook param when you create a prediction.

The service should build the absolute URL from request.headers.origin or an env override (e.g., PUBLIC_BASE_URL) if needed.

7.3 Expected flow (MVP)
UI POST /api/v1/generations → service creates a Replicate prediction with webhook.

UI polls GET /api/v1/generations/:id every ~2s.

Webhook updates status → UI shows results immediately.

8) Smoke checks (manual)
8.1 Core generation
Sign in, go to /dashboard/create.

Mode Imagine → type a short prompt → Generate.

See loading, then 1–2 images appear.

Save one to My Favorites → verify in Collections.

8.2 Quota & in‑flight
Temporarily set a plan limit in libs/app-config/runtime.ts to something tiny (e.g., monthlyGenerations: 1), restart, and:

Run one successful generation.

Try again → expect a friendly quota message.

Click Generate twice quickly → second attempt blocked with toast.

9) Quality gates (fast)
bash
Copy
npm run typecheck
npm run lint
npm run build
# Forbidden patterns:
grep -R "use server" app libs || true
grep -R "createServerClient" components || true
grep -R "service_role" app components || true
All must pass before merging/deploying.

10) Production notes (minimal)
Hosting: Vercel or any Node host. Next.js app router supported.

Env: set all secrets (NEXT_PUBLIC_*, STRIPE_*, REPLICATE_API_TOKEN).

Base URL: if required for building webhooks, set PUBLIC_BASE_URL=https://your-domain.

Supabase: same migrations as dev; copy URL/keys.

Stripe webhooks: configure a production webhook endpoint to https://your-domain/api/webhook/stripe.

Replicate webhooks: ensure the service passes the production webhook URL when creating predictions.

Deployment checklist:

✅ npm run build passes locally.

✅ Stripe webhook created & secret in prod env.

✅ Replicate predictions succeed against prod webhook.

✅ First end‑to‑end “Imagine” run works in prod.

✅ Images render from storage with correct bucket policy.

11) Common issues & fixes
401 on /dashboard: verify Supabase anon key/URL; check middleware is running (dev server logs).

Stripe webhook signature error: wrong STRIPE_WEBHOOK_SECRET (ensure it matches the active endpoint).

Replicate webhook not firing: local server isn’t public → use ngrok and pass its URL in prediction webhook.

Images not visible: check storage bucket policy (public bucket has read policy) and that we’re using public paths for result images.

Quota not enforced: service must read profiles.price_id and match an entry in runtimeConfig.plans. Ensure profile is updated by Stripe webhooks.

12) Minimal support playbook
User can’t generate → check:

Auth session valid.

profiles.has_access or free tier mapping.

In‑flight lock stuck? If a job is processing for > replicate.timeouts.overallMs, mark it failed manually and retry.

Billing questions → send portal link (Stripe customer portal route).

13) Change control
All ops/config/file additions go through CHANGE SPEC.

When you update libs/app-config/runtime.ts, paste the full file under §4.1 with exact path and content.

14) Appendix — tiny CLI helpers (optional later)
scripts/smoke.mjs to hit submit & poll once, exit non‑zero on failure.

npm run smoke wired to node scripts/smoke.mjs.
