# Phase 8 — Security & Secrets Review (Plan → Complete)

Objective: Verify least-privilege usage, absence of secret leakage to the client, and alignment with RLS/storage constraints.

Checks performed
- Secrets exposure in client code
  - Searched components for `process.env` usage and `NEXT_PUBLIC_*` only.
  - Findings: Components reference only `NEXT_PUBLIC_*` and `NODE_ENV`; no server secrets.
- Service-role usage boundaries
  - `createAdminClient` used only in webhook routes:
    - `app/api/v1/webhooks/replicate/route.ts`
    - `app/api/v1/webhooks/stripe/route.ts`
  - No admin client instantiation in any other route or component.
- Storage & RLS
  - Inputs stored under `private/<uid>/inputs/...` (DB values) and uploaded to private bucket.
  - Outputs stored under `public/renders/<renderId>/...` and referenced via public URLs.
  - Routes do not directly manipulate storage; services encapsulate storage operations.
- Config layout
  - Public values gathered from `NEXT_PUBLIC_*` envs via `libs/env/index.ts` and server-only secrets remain in `env.server`.

Controls in place
- Grep checks in `verify:grep` include scanning for `service_role` in `app components`.
- Admin client requires `SUPABASE_SERVICE_ROLE_KEY` and is wrapped in a dedicated module.
- Idempotency and capped-logging for webhooks lower the risk of noisy or exploitable logs.

Outcome
- No secret leakage to the client found.
- Service-role usage constrained to webhooks.
- Storage and RLS conventions adhered to; no direct admin operations in routes/components.

Recommendations
- Optional: add a CI step to grep for `createAdminClient` usage outside `app/api/v1/webhooks/**` and fail build if found.
- Optional: normalize remaining helper usage (e.g., `auth/me`) to `fail()` for absolute uniformity.
