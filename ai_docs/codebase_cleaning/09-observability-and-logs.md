# Observability & Logs

## What To Log
- Generation lifecycle: `{ jobId, predictionId, status, ts }`
- Webhook events: `{ predictionId, status, outputsCount, ts }`
- Errors: normalized message, upstream code, truncated details

## PII Policy
- Do not log emails or raw tokens
- Use IDs; mask sensitive payloads

## Minimal Metrics (later)
- Counts per mode, median processing time, failure rate

## Storage
- Console or simple logger in `libs/observability/logger.ts`
- Ensure logs are structured and grep-friendly
