# Phase 10 — Observability (Repo‑Wide) — Overview & Standards

Purpose
- Establish a single, consistent observability model across routes, services, and webhooks. Make logs structured, correlated, privacy‑safe, and actionable. Avoid vendor lock‑in now; keep a clean seam for future tools (Sentry, OTEL).

Goals (What “Good” Looks Like)
- Structured JSON logs with a stable schema and event naming.
- Request correlation: every log tied to `requestId` when applicable.
- Domain correlation: add `userId`, `jobId`, `predictionId` when known.
- Route timing: duration, status, method, and path logged once per request.
- Error hygiene: normalized codes/messages in responses; error logs redacted.
- No `console.*` in server code (except guarded, temporary places).
- Minimal, reliable analytics path that never blocks UX.

Non‑Goals
- No vendor APM/OTEL integration in this phase (keep seam for later).
- No heavy metrics infra; derive core metrics from logs first.

Standard Log Schema (All Events)
```json
{
  "ts": "2025-09-13T10:00:00.000Z",
  "level": "info|warn|error",
  "event": "<namespace.action>",
  "requestId": "uuid-...",           // when in HTTP context
  "route": "/api/v1/...",           // when in HTTP context
  "method": "GET|POST|...",          // when in HTTP context
  "status": 200,                      // final response only
  "durationMs": 123,                  // final response only
  "userId": "uuid?",
  "jobId": "uuid?",
  "predictionId": "rpctn_...?",
  "fields": { "key": "value" }      // event‑specific safe fields only
}
```

Event Naming (Namespaces)
- `http.request.start` / `http.request.end`
- `generation.submit`, `generation.poll_update`, `generation.debit`
- `webhook.received`, `webhook.processed`, `webhook.failed`
- `billing.checkout.started`, `billing.portal.opened`, `billing.webhook.received`
- `collections.add`, `collections.remove`, `renders.list`

Privacy & Safety
- Don’t log PII (emails, raw prompts). IDs are OK.
- Trim upstream error messages; never log full stack to clients.
- Client‐facing errors use normalized codes; server logs hold details.

Interfaces & Contracts
- Route wrappers produce `requestId`, duration, and final status logs.
- Services accept `{ supabase, logger?, requestId? }` and emit structured logs.
- Webhooks always include upstream id (`predictionId`/`event.id`) in logs and use idempotency store.

Rollout Strategy (Phased)
1) Logger standardization + context wrapper.
2) Instrument all v1 routes (start/end, errors).
3) Instrument services and webhooks (domain events).
4) Normalize error handling across routes.
5) Tighten analytics + client error capture (optional).
6) Add verify scripts; remove `console.*` from server code.

Exit Criteria
- All v1 routes emit start/end logs with `requestId`; services/webhooks emit domain logs.
- `verify:phase10` passes (no disallowed `console.*`, route coverage).
- Observability docs ready for ai_docs after code rollout.

