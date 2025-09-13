# Phase 10.4 — Services & Webhooks Instrumentation

Objective
- Thread request‑scoped loggers into services; standardize webhook logs and correlation (predictionId/event.id). Replace remaining `console.*` in services with structured logs.

Deliverables
- Update service signatures to accept optional `{ logger?, requestId? }` in context (no breaking changes):
  - generation, renders, collections, usage, billing, community.
- Webhooks: ensure receive → process → finalize logs with stable names.

Implementation Steps
1) Context signature
   - Extend service functions to read `ctx.logger` if provided; fall back to base `logger` otherwise.
   - Add helpers: `getLogger(ctx, extra?)` returns a child logger with domain fields.
2) Generation services
   - Emit: `generation.submit`, `generation.poll_update`, `generation.debit` with `{ userId, jobId, predictionId }`.
3) Storage services (assets/uploads)
   - Replace `console.*` with logger; log failures as `error` with retry counts.
4) Billing services
   - Webhook handler logs: `billing.webhook.received` `{ eventId, type }`, `billing.webhook.processed`, `billing.webhook.duplicate`.
5) Webhooks routes
   - Replicate: keep `webhook.received/processed/failed`; ensure any `console.*` removed.

Checklists
- [ ] Services accept optional logger in ctx.
- [ ] `console.*` removed from `libs/services/**` and `libs/repositories/**` (server only).
- [ ] Webhook logs include `eventId` (Stripe) or `predictionId` (Replicate).

Files to Touch (examples, sweep as needed)
- `libs/services/{generation, renders, collections, usage, billing, community.ts}`
- `libs/services/storage/{assets,uploads,management}.ts`
- `app/api/v1/webhooks/{replicate,stripe}/route.ts`

Verification
- Logs emitted at key transitions with correlation fields.
- Idempotency events (`duplicate`) logged once.

Rollback
- Context field is optional; old call sites unaffected.

