# Phase 10.1 — Logger Standardization

Objective
- Replace ad‑hoc `console.*` with a single structured logger API. Add child/context loggers and timing helpers that conform to the log schema.

Deliverables
- `libs/observability/logger.ts` extended:
  - `createLogger(baseFields)` → returns `{ info, warn, error, child(extraFields), time(label) }`.
  - `time(label)` → returns `{ end(extra?) }` to log durationMs.
- `libs/observability/redaction.ts` (helper): redact known unsafe fields (e.g., emails, raw prompts) before logging.
- Deprecation: stop using raw `logger` without context in new code; prefer request‑scoped child logger.

Implementation Steps
1) Extend logger API
   - Add `createLogger(baseFields)` and `.child(extra)` to compose default fields across layers.
   - Add `time(label)` to measure durations for blocks (use `performance.now()` or `Date.now()`).
2) Redaction helper
   - Provide `redact(fields)` that drops/obfuscates `email`, `prompt`, and any keys listed in a denylist.
3) Migration intent
   - Keep existing `logger.info|warn|error` for backward compatibility.
   - New call sites (routes/services) create a request‑scoped logger via wrapper (next phase).

Checklists
- [ ] `createLogger` implemented with `.child` and `.time`.
- [ ] Redaction helper used inside logger emission.
- [ ] Existing file passes typecheck.

Files to Touch
- `libs/observability/logger.ts`
- `libs/observability/redaction.ts` (new)

Rollback
- The old `logger` API remains; revert new helpers if necessary. No contract break.

