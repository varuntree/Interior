# Observability — Generation Flow

## Structured Logging

Use the lightweight JSON logger in `libs/observability/logger.ts`.

Format:

```json
{ "ts": "ISO8601", "level": "info|warn|error", "event": "string", "fields": { "key": "value" } }
```

Key events:
- `generation_idempotent_returned`, `generation_inflight_block`, `generation_inflight_db_block`
- `generation_submit`, `generation_submit_failed`, `generation_debit`
- `generation_poll_update`, `generation_poll_error`
- `webhook_received`, `webhook_processed` (with `durationMs`), `webhook_failed`, `webhook_canceled`, `webhook_processing`, `webhook_job_not_found`, `webhook_no_output`

## Metrics Derivation (Manual / Log-based)

- Success/Failure counts by day/week from `webhook_processed` / `webhook_failed`.
- Latency: compute from `webhook_processed.durationMs`.
- Failure reasons: aggregate `webhook_failed.error` text.

## Alerts (Suggested)

- Failure rate > X% over last N minutes.
- Median duration > threshold.
- Webhook errors per minute > threshold.

