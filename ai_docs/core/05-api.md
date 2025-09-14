# API (Contract‑First) — Interior Design Generator (Core)

Purpose
- Single source of truth for external contracts. Keep payloads small; return normalized JSON; authenticate where required. Use multipart/form-data for image uploads. Do not embed business logic here—routes call services and repos per Architecture.

Conventions
- Auth: user routes require a Supabase session (SSR client in routes). Public: community gallery, health. Admin: webhooks (service‑role client only).
- Headers: default `Cache-Control: private, no-store` (helpers set this). Public endpoints may use short caching. All v1 routes include `x-request-id` for request correlation.
- Response shape: `{ success: boolean, data?: T, error?: { code, message, details? } }`.
- Errors: `VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, TOO_MANY_INFLIGHT, LIMIT_EXCEEDED, UPSTREAM_ERROR, INTERNAL_ERROR, METHOD_NOT_ALLOWED, CONFIGURATION_ERROR`.

Auth
- GET `/api/v1/auth/me` — Returns minimal user identity. Auth required.
  - Response: `{ success: true, data: { id, email, createdAt } }`
  - Errors: 401 UNAUTHORIZED

Generations
- POST `/api/v1/generations` — Submit a generation job. Auth required.
  - Content types:
    - `multipart/form-data` (recommended): fields `mode` ('redesign'|'staging'|'compose'|'imagine'), optional `prompt`, `roomType`, `style`, optional `idempotencyKey` (uuid); files `input1` (required for redesign/staging/compose), `input2` (required for compose).
    - `application/json`: same scalar fields accepted; image URLs are not supported for MVP (use multipart for uploads).
  - Response 202: `{ success: true, data: { id, predictionId, status, settings } }`
  - Errors: 400 VALIDATION_ERROR (missing inputs, bad fields), 401 UNAUTHORIZED, 402 LIMIT_EXCEEDED, 409 TOO_MANY_INFLIGHT, 500 CONFIGURATION_ERROR (base URL), 500 INTERNAL_ERROR.
- GET `/api/v1/generations/:id` — Fetch job status. Auth required.
  - Response: when in progress `{ id, status, createdAt, settings }`; when succeeded `{ ..., completedAt, variants: [{ index, url, thumbUrl? }] }`
  - Polling: non‑terminal, stale jobs may be refreshed once from Replicate.
  - Errors: 401, 404.
- PATCH `/api/v1/generations/:id` — Currently supports `{ action: 'cancel' }` for in‑progress jobs. Auth required.

Renders
- GET `/api/v1/renders?mode=&roomType=&style=&limit=&cursor=&search=` — List user renders. Auth required.
  - Response: `{ renders: [{ id, mode, room_type, style, cover_variant, created_at, cover_variant_url }], pagination: { nextCursor, hasMore, limit }, totalCount? }`
  - Filtering: `mode` in ['redesign','staging','compose','imagine']; free‑text `search` matches mode/room/style.
- GET `/api/v1/renders/:id` — Render details with variants. Auth required.
  - Response: `{ id, jobId, mode, roomType, style, coverVariant, createdAt, variants: [{ id, index, imageUrl, thumbUrl? }] }`
- PATCH `/api/v1/renders/:id` — Update cover variant. Auth required.
  - Body: `{ coverVariant: number }`.
- DELETE `/api/v1/renders/:id` — Delete a render (DB records; storage cleanup optional later). Auth required.

Collections
- GET `/api/v1/collections` — List user collections; ensures default “My Favorites” exists. Auth required.
  - Response: `{ collections: [{ id, name, isDefaultFavorites, itemCount, createdAt }] }`
- POST `/api/v1/collections` — Create a collection. Auth required.
  - Body: `{ name: string (1..100) }`
- GET `/api/v1/collections/:id?limit=` — Get a collection and items. Auth required.
  - Response: `{ collection: { id, name, isDefaultFavorites, itemCount, createdAt }, items: [{ renderId, addedAt, render?: { id, mode, roomType, style, coverVariant, coverImageUrl, createdAt } }] }`
- PATCH `/api/v1/collections/:id` — Rename (not default). Auth required.
  - Body: `{ name: string (1..100) }`
- DELETE `/api/v1/collections/:id` — Delete (not default). Auth required.
- GET `/api/v1/collections/:id/items?limit=&offset=` — List items with simple pagination. Auth required.
  - Response: `{ items: [...], pagination: { limit, offset, hasMore, total } }`
- POST `/api/v1/collections/:id/items` — Add items.
  - Single render: `{ renderId }`
  - Batch renders: `{ renderIds: string[] }`
  - Single community image: `{ communityImageId }` (Phase 11)
  - Special case: `:id = 'favorites'` acts as add‑to‑default for either kind.

Favorites (Shortcuts)
- POST `/api/v1/favorites/toggle` — Toggle a favorite in default favorites. Auth required.
  - Body: one of `{ generationId: uuid }` (render) or `{ communityImageId: uuid }` (community image)
  - Response: `{ isFavorite: boolean }`

Community (Public Read)
- GET `/api/v1/community?limit=&cursor=` — Flat, public gallery list (no search/featured in MVP).
  - Response: `{ items: [{ id, imageUrl, thumbUrl?, applySettings?, createdAt }], nextCursor?: string }`

Analytics (Public/Non-blocking)
- POST `/api/v1/analytics/event` — Logs lightweight analytics events. Accepts `{ type: 'page'|'generation_submit'|'generation_done'|'error', payload? }`. Always returns OK and never blocks UX.

Usage
- GET `/api/v1/usage?includeHistory=&historyLimit=` — Usage summary and plan info. Auth required.
  - Response: `{ usage: { currentMonth: { used,debits,credits }, remaining, monthlyLimit, percentage }, plan: {...}, billingPeriod: { start,end,daysRemaining }, billing: { customerId, hasAccess, subscriptionStatus }, computed: { isNearLimit, canGenerate, daysUntilReset, averagePerDay }, history? }`

Webhooks (Admin‑Only)
- POST `/api/v1/webhooks/replicate` — Receives Replicate prediction updates. Verifies signature if configured. Uses admin Supabase client. Idempotent: on success creates render/variants and marks job succeeded; on failure marks job failed.
- POST `/api/v1/webhooks/stripe` — Receives Stripe events; verifies via Stripe library; updates profiles/subscriptions using admin client.
  - Both return 200 even on internal handling errors (to avoid noisy retries), but log errors server‑side.

Health & Status
- GET `/api/v1/health` — Public health OK with timestamp and version.
- GET `/api/v1/status` — Supabase connectivity check.

Notes
- Allowed values (modes, styles, room types, limits) come from `libs/app-config/runtime.ts` and should not be hardcoded in clients.
- Image uploads: enforced accepted MIME types and size per runtime config; inputs stored in private bucket; outputs served from public.
- Idempotency: supported on generation submit via `idempotencyKey` (per‑owner). Services de‑dupe jobs and ledger entries.
- Observability: Each route emits `http.request.start/end` logs and domain events (e.g., `generation.submit`). See observability spec.
