0) Purpose
Lightweight guardrails to catch breakage early without slowing us down. No heavy CI, no complex test pyramid. A small, reliable set of checks and a couple of smoke tests.

1) Quality gates (run locally before merge)
Add (or use) the following npm scripts (names are suggestions):

arduino
Copy
npm run typecheck      // tsc --noEmit
npm run lint           // eslint .
npm run build          // next build
npm run verify:grep    // forbidden pattern scan (see below)
1.1 Grep checks (from our Handbook)
Run these; all must return 0 matches:

nginx
Copy
grep -R "use server" app libs || true
grep -R "createServerClient" components || true
grep -R "service_role" app components || true
(We expect no occurrences in those folders; service‑role is only in /app/api/webhook/**.)

2) Minimal automated tests (MVP)
We keep this scoped to two tiny areas that give maximum signal:

2.1 Prompt builder unit test
Target: a pure function buildPrompt({ mode, roomType, style, userPrompt }).

Asserts:

Includes AU context.

Keeps architecture guardrails for Redesign/Staging/Compose.

“Imagine” requires userPrompt.

Why: Protects UX intent and reduces LLM regressions when prompts change.

2.2 Adapter mapping unit test
Target: replicateAdapter.toReplicateInputs (pure function).

Asserts:

aspect ratio → width/height mapping (1:1 / 3:2 / 2:3).

variants → num_outputs.

quality tiers → size tier logic.

These two tests can run with Vitest or Jest. If we prefer zero setup for now, we can also run them with ts-node and simple assert calls. Keep it tiny.

3) API smoke tests (manual or script)
No full E2E; just prove the contract.

3.1 Manual curl (dev server running)
Submit (multipart, using a small placeholder image):

bash
Copy
curl -X POST http://localhost:3000/api/v1/generations \
  -H "Authorization: Bearer <dev-session-cookie-or-header>" \
  -F "mode=imagine" \
  -F "roomType=Living Room" \
  -F "style=Coastal AU" \
  -F "prompt=A bright coastal living room with light oak and linen" \
  -F "aspectRatio=1:1" -F "quality=auto" -F "variants=2"
Expect: 202 { success: true, data: { id, predictionId, status } }.

Poll:

bash
Copy
curl http://localhost:3000/api/v1/generations/<id>
Expect processing → succeeded with variants[] (URLs) or failed with normalized error.

3.2 Collections
Create new collection, add/remove an item via the respective endpoints (as specified in API doc). Expect normalized { success: boolean }.

If we don’t want curl, we can add a tiny Node script later (optional) that runs these calls and exits non‑zero on failure.

4) UI smoke checklist (manual, <5 minutes)
Run locally after a change:

Sign in → redirected to /dashboard.

Go to Create, select Imagine, enter prompt → Generate. See loading → result grid appears.

Save first variant to My Favorites → check in Collections.

Open My Renders → the last render is visible.

Go to Community → click “Try this look” → Create opens pre‑filled.

Attempt Generate again while job in‑flight → see blocking toast.

Temporary network error (simulate offline) → UI shows friendly error; returns to idle state.

5) Error & log normalization
All API responses follow the shape:

ts
Copy
{ success: boolean, data?: T, error?: { code: string; message: string; details?: unknown } }
On server, log { jobId, predictionId, status } transitions and any upstream error message (trimmed).

6) Performance sanity
Avoid loading huge images in lists (use CSS max‑width, lazy loading).

No extra client libraries for uploads (native file input is enough for MVP).

Build must pass without Next warnings.

7) Definition of Done (MVP)
A change is “done” when:

✅ npm run typecheck && npm run build pass.

✅ grep checks pass (no forbidden patterns).

✅ Prompt builder & adapter unit tests pass (or manual asserts if no framework).

✅ Manual API smoke calls succeed (submit + poll).

✅ UI smoke checklist passes end‑to‑end with one successful generation.

8) Optional (nice to have later, not now)
Add Playwright with 1–2 happy‑path flows (signin stub + imagine flow).

Simple “smoke:api” Node script in scripts/smoke.mjs.

Error boundary screenshots (already have a friendly error page).

