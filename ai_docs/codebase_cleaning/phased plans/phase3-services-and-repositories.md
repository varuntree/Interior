# Phase 3 — Services & Repositories Boundaries (Plan → Complete)

Objective: Enforce clean layering by ensuring routes do not access repositories or perform direct DB calls; services encapsulate business logic; repositories perform only DB I/O with `SupabaseClient`.

Actions taken
- Removed direct repository/DB usage from routes:
  - Generations [id]: variants fetch/deletion moved to `libs/services/renders`; cancel moved to `libs/services/generation.cancelGeneration`.
  - Replicate webhook: all job state transitions and asset processing moved to `libs/services/generation_webhooks.handleReplicateWebhook`.
  - Usage: route now uses `libs/services/profile.getProfile` instead of repo.
  - Analytics: route now calls `libs/services/analytics.logEvent` (no direct `.from()` in routes).
  - Status: route now calls `libs/services/health.checkDbConnectivity`.
- Verified repositories remain pure and typed; services accept `{ supabase }` context and compose repos/SDKs only.

Validation
- `npm run typecheck && npm run lint && npm run build && npm run verify:grep` all pass.
- `rg` checks:
  - No `from '@/libs/repositories/` in `app/api/v1/**`.
  - Minimal direct `.from()` usage in routes eliminated (analytics/status addressed).

Exit criteria (met)
- No repository imports in v1 routes; all data access via services.
- Services contain business logic; routes validate/orchestrate only.
- Repositories remain pure DB I/O with `SupabaseClient`.
- All scripts pass; behavior unchanged.
