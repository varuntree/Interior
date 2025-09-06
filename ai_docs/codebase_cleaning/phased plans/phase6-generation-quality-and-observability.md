# Phase 6 — Generation Engine Quality & Observability (Plan → Complete)

Objective: Improve reliability and visibility of the generation pipeline via unit tests, idempotency checks, and structured logging.

Actions taken
- Unit tests (Vitest):
  - `tests/prompt-builder.test.ts`: Validates structural guardrails, AU context, and Imagine prompt requirement.
  - `tests/replicate-adapter.test.ts`: Validates aspect ratio mapping, variant clamping, image array mapping, and webhook URL building.
  - Added `vitest` dev dep and `vitest.config.ts` with alias for `@`.
  - Script: `npm run test`.
- Observability & logs:
  - `libs/services/generation.ts`: Logs at submit, debit, and poll transitions with minimal fields (no PII).
  - `libs/services/generation_webhooks.ts`: Logs for processed, failed (capped error), canceled, and processing.
- Idempotency:
  - Submit path checks existing idempotencyKey and returns job when present (pre-existing); retained and documented.
  - Webhook handler is idempotent-safe (updates are idempotent; assets creation wrapped; failures logged and truncated).
- Error handling:
  - Normalize upstream errors and cap error length to prevent log floods.

Validation
- All scripts pass: `typecheck`, `lint`, `build`, `verify:grep`.
- Unit tests pass: `npm run test`.

Exit criteria (met)
- Minimal, reliable tests guarding critical mapping/templating behavior.
- Structured logging around key state transitions.
- Idempotency enforced on submit; webhook safe to repeat.
