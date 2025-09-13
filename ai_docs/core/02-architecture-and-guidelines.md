# Architecture & Guidelines — Interior Design Generator (Core)

Purpose
- Define how the system is wired, the boundaries each layer must respect, and the minimal conventions that keep the codebase simple and maintainable. Read this before adding endpoints or services. Code lives in the repo; this document states contracts and guardrails, not full code.

System Topology (Layering)
- UI (Next.js App Router) → API Route Handlers (`app/api/v1/**`) → Services (`libs/services/**`) → Repositories (`libs/repositories/**`) → Database/Storage (Supabase). External integrations: Replicate (google/nano‑banana) and Stripe.
- Strict boundaries: no Server Actions; no DB calls from components; routes do input validation + orchestration only; business logic stays in services; repositories are thin typed DB helpers using the Supabase client passed by caller.

Clients & Secrets (Usage Model)
- Browser: may use Supabase Auth UI flows only; never touches app data directly—use API.
- SSR (server): `libs/supabase/server.createClient()` for auth checks/guards in layouts and routes; never embed secrets.
- Admin (service‑role): service role is server‑only. Primary use is webhooks (Stripe/Replicate). A temporary exception is allowed for admin-only endpoints under `/app/api/v1/admin/**`, strictly gated by an allowlist in `ADMIN_EMAILS` and never exposed to the client. Remove this exception when the admin UI is retired.
- Middleware: `middleware.ts` calls `libs/supabase/middleware.updateSession` to refresh session cookies on navigation.

- Configuration (Single Sources of Truth)
- Product/runtime knobs live in `libs/app-config/runtime.ts`: presets (Room Types, Styles), defaults (mode), enforcement limits (accepted mime types, max upload size), plan caps keyed by Stripe priceId, and Replicate settings (webhook path, timeouts, polling). The UI renders from this file; services enforce from it; avoid hardcoding copies in components.
- Brand/marketing and plan metadata live in `config.ts` (app name, domain, Stripe plan list used by marketing pages). Do not duplicate runtime product logic here.
- Environment variables are validated in `libs/env/index.ts` (public vs server‑only). Required keys include Supabase URL/Anon key (public), and server keys like `REPLICATE_API_TOKEN`, `REPLICATE_WEBHOOK_SECRET` (optional in dev), `SUPABASE_SERVICE_ROLE_KEY` (webhooks), `PUBLIC_BASE_URL` (optional for webhook URL construction), and `ADMIN_EMAILS` (comma-separated allowlist for temporary admin endpoints).

API Layer (Route Handlers)
- Location: `app/api/v1/<domain>/<action>/route.ts`. Responsibilities: enforce method (`withMethods`), validate input (Zod), create a standard server client (non‑admin), call a service, and return normalized JSON via helpers.
- Response contract: all endpoints return `{ success: boolean, data?: T, error?: { code: string; message: string; details?: unknown } }`. Use `ok()`/`fail()` from `libs/api-utils/responses` (defaults to `Cache-Control: private, no-store`).
- Common error codes: `VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, TOO_MANY_INFLIGHT, LIMIT_EXCEEDED, UPSTREAM_ERROR, INTERNAL_ERROR, METHOD_NOT_ALLOWED, CONFIGURATION_ERROR`.
- Conventions: no repository imports in routes; no service‑role clients; set `export const dynamic = 'force-dynamic'` when responses must avoid caching; idempotency is enforced by services; keep JSON bodies small and rely on multipart/form-data for image uploads.

Services Layer (Business Logic)
- Location: `libs/services/**` (pure functions, no classes). Accept context `{ supabase: SupabaseClient, ... }` and typed args; compose repositories and external SDKs; apply product rules.
- Example (generation service): checks one in‑flight job per user; validates inputs and prompt moderation; uploads inputs to private storage; composes a prompt from mode + AU context + user text; maps settings via adapter; creates Replicate prediction with a webhook URL; persists a job row with status `starting`; debits one usage; returns a job summary. Polling may refresh non‑terminal jobs if stale.
- Keep external model specifics isolated to adapters; services only pass internal types (e.g., `GenerationRequest`) and receive normalized responses.

Repositories (DB Access)
- Location: `libs/repositories/**`. Rule: small, typed functions that accept a Supabase client and return typed rows. No HTTP or Next imports; no business logic. Respect RLS by design: owner‑scoped reads/writes for user tables; public read for community tables.
- Typical files: `generation_jobs.ts`, `renders.ts` (+ `render_variants`), `collections.ts` (+ items), `usage.ts`, `profiles.ts`.

- Storage & Paths
- Buckets: `public` (public read, auth write) and `private` (owner‑scoped via RLS). Inputs (user uploads) go to `private/${userId}/inputs/<uuid>.<ext>`; outputs to `public/renders/${renderId}/<idx>.jpg`; thumbnails optional at `.../<idx>_thumb.webp`.
- Signed URLs: create short‑lived signed URLs for input images passed to Replicate; public result URLs are served directly. Never expose service‑role keys to generate signed URLs in client code.

Webhooks (Async Backbone)
- Replicate: `POST /api/v1/webhooks/replicate` receives prediction updates. Verify with a shared secret when available; otherwise restrict by IP and include a shared token header. Handler is idempotent: if status is `succeeded`, download/store outputs to `public` storage, create a `render` with `render_variants`, and mark the job succeeded. On `failed`, set error and terminal status. Use the admin client only here.
- Stripe: subscription events update profiles (e.g., `price_id`) and access flags. Admin client is permitted in this webhook route only. Runtime plan caps are then derived from `runtime.ts` by priceId.

Auth & Guards
- Private pages live under `(app)/dashboard/*` and are gated in layout using the SSR Supabase client. Unauthenticated users are redirected to `config.auth.loginUrl`.
- API routes require auth for user‑owned data. For public resources (community list), allow unauthenticated reads explicitly.

Performance & Reliability Principles
- Submissions return quickly (accepted/202) and rely on webhooks to complete. Enforce one in‑flight job per user to simplify UX and avoid surprises. Apply exponential backoff on transient upstream errors in clients; services may retry creation if safe.
- Treat jobs older than a hard cap (from runtime `timeouts.overallMs`) as stuck; flip to `failed` while still allowing a late webhook success to finalize idempotently.
- Prefer `.jpg` outputs; lazy‑load offscreen images; keep API responses uncached (`no-store`) unless explicitly beneficial.

Security Checklist (Essentials Only)
- Service‑role keys are server‑only and limited to webhooks; never import them in general routes or UI. RLS is enabled on all user‑owned tables; public read is explicit for community tables. Inputs live in the private bucket; outputs in public.
- Validate and sanitize all inputs with Zod; normalize errors; never echo raw upstream errors to clients. Keep secrets in env and validated by `libs/env`.

- Observability (Simple & Standard)
- All v1 routes are wrapped with `withRequestContext` which:
  - generates a `requestId`, adds `x-request-id` to responses,
  - logs `http.request.start` and `http.request.end` with `status` and `durationMs`.
- Logs are single‑line JSON via `logger.info|warn|error(event, fields)`.
- Services emit domain events (e.g., `generation.submit`, `renders.list`) and never log PII; IDs only (userId/jobId/predictionId).

Minimal Dependency Policy (When to Add a Library)
- Add only if: (1) it replaces custom code that is complex or bug‑prone, (2) improves performance measurably, or (3) meaningfully improves UX. It must be compatible with Next.js App Router, small, tree‑shakeable, and not duplicate existing utilities. Otherwise, prefer reuse.

Extension Points (How to Add Features)
- New endpoint: create `app/api/v1/<domain>/<action>/route.ts`, validate with Zod, call a service, return via `ok`/`fail`. If a legacy path exists, re‑export to the v1 route to preserve behavior.
- New business logic: add a function in `libs/services/<domain>.ts`, compose existing repos and adapters, and keep model specifics in `libs/services/external/*`.
- New data: add an idempotent migration under `migrations/phaseX/NNN_<name>.sql` with RLS; mirror it with a small repository file.

Tiny Snippets (for shared mental model)
- Normalized response shape:
  - `{ success: true, data }` or `{ success: false, error: { code, message, details? } }` (helpers in `libs/api-utils/responses`).
- Method enforcement:
  - `withMethods(['GET'|'POST'|...], handler)` rejects others with `405 METHOD_NOT_ALLOWED`.

Cross‑References
- For product/UX context, see 01 Overview & UX. For schemas and storage, see 03 Data & Storage. For prompts, adapter mapping, and generation lifecycle, see 04 Generation Engine. For endpoint contracts, see 05 API.
