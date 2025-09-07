# Deployment & Ops — Interior Design Generator (Core)

Purpose
- Minimal, practical steps to run locally and deploy. Keep it lean: set envs, run dev, wire webhooks. Prefer Vercel for hosting; Docker works if needed. This mirrors the current codebase behavior and environment validators.

Environments & Required Variables
- Public (client‑exposed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Server-only: `REPLICATE_API_TOKEN` (required), `SUPABASE_SERVICE_ROLE_KEY` (webhooks only), `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (billing), `PUBLIC_BASE_URL` (optional; if not set, base URL is inferred from request when creating webhooks). `OPENAI_API_KEY` is optional and only needed if using an openai/* model.
- Recommended: `NEXT_PUBLIC_APP_URL` or `PUBLIC_BASE_URL` set to your HTTPS origin in prod (used to build absolute webhook URL).

Local Development (Quickstart)
- Copy `.env.example` → `.env.local`, then fill the variables above. Ensure `REPLICATE_API_TOKEN` is set, and Supabase URL/Anon are from your project. `OPENAI_API_KEY` is optional and only needed if using an openai/* model.
- Install and run:
  - `npm install`
  - `npm run dev`
- Open http://localhost:3000 and sign in (Supabase auth). Dashboard routes are gated by the layout.

Database & Storage Setup (Supabase)
- In the Supabase SQL editor, apply migrations in order (phase1 → phase2 → later phases). Tables include profiles, generation_jobs, renders (+variants), collections (+items), community, usage_ledger. RLS is enabled by migrations.
- Buckets created by migrations: `public` (public read), `private` (owner‑scoped). No extra bucket creation needed.

Replicate Webhook (Dev)
- Expose your dev server: `ngrok http 3000` (or use a Vercel preview). Set `PUBLIC_BASE_URL` to the tunnel URL (e.g., https://abc.ngrok.io) or rely on request origin if supported.
- The service builds a webhook URL as `baseUrl + runtime.replicate.webhookRelativePath` (defaults to `/api/v1/webhooks/replicate`). Ensure the route is reachable from Replicate.
- Optional: set `REPLICATE_WEBHOOK_SECRET` to verify signatures; otherwise rely on IP restrictions.

Stripe Webhook (Dev)
- Install Stripe CLI and run:
  - `stripe login`
  - `stripe listen --forward-to http://localhost:3000/api/v1/webhooks/stripe`
- Put the printed signing secret in `.env.local` as `STRIPE_WEBHOOK_SECRET`.

Production Deployment
- Vercel (recommended):
  - Build command `npm run build`; Node 18+. Add required env vars in the project settings (both production and preview).
  - Configure your domain and HTTPS. Set `PUBLIC_BASE_URL` to `https://your-domain`.
  - Ensure Stripe and Replicate webhooks point to the production URLs.
- Docker (alternative): use a multi‑stage Node 18 image; run the Next.js standalone output; expose port 3000.

Post‑Deploy Smoke Check
- Sign in and run Imagine mode with a simple prompt; confirm results appear in My Renders. Try Save to Favorites; verify it shows in Collections. Confirm `/api/v1/health` returns ok and `/api/v1/status` reports Supabase connectivity.

Common Pitfalls
- Missing `REPLICATE_API_TOKEN` → generation submit fails with configuration error.
- Webhook not firing in dev → ensure `PUBLIC_BASE_URL` uses your ngrok URL and that `/api/v1/webhooks/replicate` is accessible.
- Images not visible → verify outputs are written to `public` bucket and that URLs resolve under your Supabase storage domain.
- Quota not enforced → ensure Stripe webhook updates `profiles.price_id`; runtime plans map that priceId to monthly caps.

Operations Notes
- Health endpoints: `GET /api/v1/health` (app heartbeat), `GET /api/v1/status` (DB connectivity).
- Storage cleanup is optional in MVP; deletes remove DB rows, not necessarily files. A cleanup helper exists and can be wired later.
- Prefer `.webp` outputs, lazy‑load images in UI, and avoid caching API responses unless explicitly public.
