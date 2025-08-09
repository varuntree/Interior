PHASE_01__baseline-wiring.md
1) Title & Goal
Baseline wiring (no features): make the golden path runnable with our guardrails; establish stubs and utilities so later phases can add features safely.

2) Scope (In/Out)
In

Confirm API utilities exist and are imported via a single place:

libs/api-utils/responses.ts (already present; use as-is).

Add libs/api-utils/methods.ts with withMethods(...) (if missing).

Add libs/api-utils/supabase.ts thin wrapper that returns the standard server Supabase client from libs/supabase/server.ts.

Add a minimal Replicate adapter stub at libs/services/replicate.ts with generateImageStub(...) returning a fake payload (no network).

Types: Add types/generation.ts (status enum, DTOs) used across phases.

Verify /app/(app)/dashboard/layout.tsx auth guard works against /api/v1/auth/me.

Out

No DB tables, no UI generator form, no external API calls.

No pricing/credits or uploads.

3) Spec References
ai_docs/specs/01-prd.md — Vision & scope (core flows: Generate → Review → Save).

ai_docs/specs/02-system-architecture-and-api.md — Golden path, normalized API responses, routing boundaries.

ai_docs/specs/06-testing-and-quality.md — Minimal build/grep/smoke checks.

ai_docs/docs/01-handbook.md — Guardrails (§0) and Golden Path (§1).

ai_docs/docs/02-playbooks-and-templates.md — API route + service + repo templates.

4) Planned Changes (by layer)
API routes
No new routes required in this phase. Ensure /api/v1/auth/me is present and returns 200 for authed, 401 otherwise.

Services
Add libs/services/replicate.ts (stub only):

export async function generateImageStub(args: { prompt: string }): Promise<{ url: string; provider: 'stub'; meta: Record<string, any> }>

Implementation returns a deterministic placeholder (e.g., a static Unsplash-like URL string) so consumers can wire end‑to‑end without network flakiness.

Add libs/api-utils/supabase.ts:

export function createServiceSupabaseClient() { return createClient() }

(Re-export from libs/supabase/server.ts to align with playbooks.)

Repositories / DB
None.

Storage
None.

UI
None. We only validate the existing dashboard auth protection.

Config
None (read-only). Do not alter config.ts.

5) Constraints & Guardrails
Do-Not-Touch: Repeat docs/01-handbook.md §0 guardrail list (no deletions/renames of protected files).

No Server Actions.

No direct DB calls from components.

Normalized JSON for all API routes (already covered by responses.ts).

Add files only; do not modify existing guardrail files.

6) Acceptance Criteria (Verifier will check)
npm run build passes; typecheck clean.

Grep checks (from Testing doc) all green:

grep -R "use server" app libs → 0

grep -R "service_role" app components → 0

grep -R "createServerClient" components → 0

Unauthed visit to /dashboard redirects to /signin; authed returns 200.

libs/api-utils/methods.ts and libs/api-utils/supabase.ts exist and compile.

libs/services/replicate.ts exports generateImageStub(...) and compiles.

types/generation.ts exports GenerationStatus = 'processing'|'succeeded'|'failed' (enum/union) and basic DTOs.

7) Artifacts (per phase)
Planner output → ai_docs/changes/PHASE_01__change_spec.md (strict CHANGE SPEC format, listing added files with full content).

Verifier output → ai_docs/reports/PHASE_01__qa-report.md (build/grep notes + manual auth check).