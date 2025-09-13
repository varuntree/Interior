0) Purpose
Define a simple, repo‑wide observability standard so we can trace user requests, debug problems quickly, and derive basic metrics — without adding heavy infra or vendor lock‑in.

1) Principles
- Keep it boring: one tiny logger, one request wrapper.
- Logs are structured JSON (one line per event) to make grep/search easy.
- Add correlation — requestId, userId, jobId, predictionId — only when known.
- Don’t log PII (emails, raw prompts, tokens). Redact at the edge.
- Analytics never blocks UX.

2) Log Schema (stable fields)
ts
Copy
{
  ts: string,                    // ISO timestamp
  level: 'info'|'warn'|'error',
  event: string,                 // namespace.action
  fields?: {
    requestId?: string,
    route?: string,
    method?: string,
    status?: number,             // on http.request.end
    durationMs?: number,         // on http.request.end
    userId?: string,
    jobId?: string,
    predictionId?: string,
    // ... domain-specific keys
  }
}

3) Event Names (namespaces)
- http.request.start | http.request.end | http.request.error
- generation.submit | generation.status | generation.cancel | generation.delete | generation.poll_update
- renders.list | renders.detail | renders.update_cover | renders.delete
- collections.list | collections.detail | collections.create | collections.rename | collections.delete
- collections.items.list | collections.items.add | collections.items.batch_add | collections.items.remove | collections.items.toggle
- favorites.list | favorites.toggle
- community.list
- analytics.event.logged
- webhook.received | webhook.processed | webhook.error | webhook.signature_invalid
- billing.checkout.started | billing.checkout_error | billing.portal.opened | billing.portal_error
- billing.webhook.received | billing.webhook.processed | billing.webhook.error
- storage.asset_process_error | storage.cleanup_warning | storage.delete_warning

4) How it works (implementation summary)
- Request wrapper (withRequestContext)
  - Adds requestId, emits http.request.start on entry
  - Calls handler with ctx { logger, requestId }
  - Sets x-request-id on response
  - Emits http.request.end with { status, durationMs }
- Logger
  - createLogger(base).child(extra) to add context incrementally
  - logger.time(label).end() to emit duration for a code block
  - Shallow redaction of obvious PII (email, prompt)

5) Route usage (pattern)
ts
Copy
export const GET = withMethods(['GET'], withRequestContext(async (req, ctx) => {
  try {
    // ... handler
    ctx.logger.info('renders.list', { userId, count: items.length })
    return ok(data)
  } catch (e) {
    ctx.logger.error('renders.list_error', { message: (e as any)?.message })
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch renders')
  }
}))

6) Service usage (pattern)
ts
Copy
import { getLoggerFromCtx } from '@/libs/observability/logger'

export async function doThing(ctx: { logger?: Logger; supabase: SupabaseClient }, args: X) {
  const log = getLoggerFromCtx(ctx, { domain: 'thing' })
  log.info('thing.start', { id: args.id })
  // ...
  log.info('thing.done', { id: args.id })
}

7) Error handling
- Routes return normalized responses via ok/fail helpers.
- Catch blocks log a structured error event before returning fail().
- Webhooks log errors but still return 200 to avoid noisy provider retries.

8) Analytics (minimal)
- Endpoint: POST /api/v1/analytics/event
- Validates type, clamps payload (~8KB). Logs analytics.event.logged.
- Always returns OK; never blocks UX.

9) Metrics from logs (derivable)
- Per‑route latency and error rates from http.request.end (durationMs, status).
- Generation lifecycle counts from generation.* events.
- Webhook success/failure rates from webhook.* events.

10) Guards (verify script)
- Script: scripts/verify-phase10.sh
  - No console.* in server code.
  - All v1 routes use withRequestContext.
  - No raw Response.json({ success: false }). Use fail().
  - Optionally run typecheck/lint/build.

11) Future‑proofing
- If adopting Sentry/OTEL later, swap logger backend or add a transport — route/service code stays unchanged.

