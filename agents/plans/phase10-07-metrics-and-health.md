# Phase 10.7 — Metrics from Logs & Health

Objective
- Derive basic operational metrics from logs and ensure health endpoints are useful. Defer full metrics infra.

Metrics (derived from logs)
- Request volume per route (count `http.request.end`).
- Error rate per route (end logs with `status >= 500` or error events).
- Latency p50/p95 per route (compute from `durationMs`).
- Generation lifecycle counts (submit/succeeded/failed).
- Webhook success/failure rates.

Deliverables
- Ensure `http.request.end` has `durationMs`, `status`, `route` across all routes.
- Add lightweight `GET /api/v1/health` enrichment (optional): include app version and timestamp (already OK); avoid heavy checks.

Implementation Steps
1) Confirm route end logs carried everywhere (Phase 10.3).
2) Optionally add a tiny script or doc on how to query logs (hosting provider dependent).

Checklists
- [ ] All routes emit end logs with status + duration.
- [ ] Health endpoint remains fast and reliable.

Files to Touch
- Route wrappers only (already covered).

Rollback
- N/A — this is reinforcement of earlier steps.

