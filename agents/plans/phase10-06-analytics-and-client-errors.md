# Phase 10.6 — Analytics & Client Error Capture (Optional)

Objective
- Keep analytics minimal and non‑blocking; optionally capture client‑side errors to a first‑party endpoint for debugging.

Deliverables
- Harden `/api/v1/analytics/event` to use structured logs (info on success, warn on failure) and clamp payload size.
- Add optional client error reporter (ErrorBoundary → POST to analytics with throttle).

Implementation Steps
1) Analytics route
   - Use request logger; log `analytics.event.logged` with `{ type }`.
   - Clamp payload size (e.g., 4–8KB) and drop large fields.
2) Client error reporter (optional)
   - In `app/error.tsx`, POST a small error report (`digest`, `message`, `url`) to analytics with debounce/throttle.
   - Ensure no user PII is sent.

Checklists
- [ ] Analytics route uses request logger and clamps payload.
- [ ] Optional client error POST added with throttle.

Files to Touch
- `app/api/v1/analytics/event/route.ts`
- `app/error.tsx` (optional)

Verification
- Large payloads are trimmed; route never blocks UX.

Rollback
- Client reporter is optional; analytics route changes are backward‑compatible.

