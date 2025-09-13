# Phase 10.9 — Cutover & Cleanup

Objective
- Complete adoption, remove stragglers, and capture a short post‑rollout validation.

Deliverables
- All server logs routed through structured logger.
- All v1 routes wrapped and emitting start/end logs.
- Webhooks and high‑value services instrumented with domain logs.
- Grep/verify scripts green.

Final Sweep Checklist
- [ ] No `console.*` in server code (routes/services/repos/observability libs/stripe).
- [ ] All v1 routes: request wrapper + `x-request-id` header.
- [ ] Error normalization consistent (`fail()` + codes).
- [ ] Generation + webhook flows emit domain events with correlation ids.
- [ ] `verify:phase10` passes locally.
- [ ] Add note in tracker and prep ai_docs update (docs done in separate step).

Rollback
- Revert per file; wrapper/context API is additive.

