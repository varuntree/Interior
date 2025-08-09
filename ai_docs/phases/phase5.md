PHASE_05__billing-and-credits.md
1) Title & Goal
Plan Caps & Credits: enforce monthly generation caps per plan from a central config file (without touching config.ts), wire the existing Stripe checkout/portal, and show remaining credits in UI.

2) Scope (In/Out)
In

Central limits mapping (new file) keyed by priceId and a default/free tier.

Enforcement inside POST /api/v1/generations/submit (before job creation).

“Remaining credits” surface in UI; upgrade CTA → existing Stripe routes.

No extra tables — compute usage from generations by month.

Out

Proration display, detailed billing history, coupon UX (already supported at Stripe).

3) Spec References
specs/05-payments-and-pricing.md — Plan strategy & caps.

docs/01-handbook.md — Stripe is already wired; admin client only in webhooks.

specs/06-testing-and-quality.md — minimal smoke on credits.

4) Planned Changes (by layer)
API routes
Modify app/api/v1/generations/submit/route.ts

Before single in‑flight check, enforce credits:

Load user profile (profiles row).

Resolve plan cap via price_id and a central PLAN_LIMITS.

Compute month window (UTC): periodStart = date_trunc('month', now()).

Count generations rows for this user since periodStart with status in ('processing','succeeded','failed') OR just count submissions (recommended: count all rows created).

If count >= cap → fail(402, 'NO_CREDITS', 'You’ve reached this month’s generation limit. Upgrade to continue.').

On success, proceed exactly as Phase 3.

Services
Add libs/services/credits.ts

getPlanCapForUser(ctx, { userId }): Promise<number>

read profile → price_id → lookup in PLAN_LIMITS → number.

getUsageThisPeriod(ctx, { userId }): Promise<number>

query generations since month start.

checkAndConsumeCredit(ctx, { userId }): Promise<{ ok: true } | { ok: false; reason: 'NO_CREDITS' }>

returns decision only (no decrement table).

Update libs/services/generations.ts

Call checkAndConsumeCredit at the top of submitGeneration flow (or let route do it; pick one place and keep it single‑sourced — prefer route per our API standard).

Add libs/constants/limits.ts

ts
Copy
// Central, easy-to-edit plan caps (do not touch config.ts)
export const PLAN_LIMITS: Record<string, number> = {
  // 'price_xxx': 50,   // Starter (example)
  // 'price_yyy': 200,  // Advanced (example)
}
export const DEFAULT_FREE_CAP = 10   // applies when price_id is null/unknown
Varun will edit these values; agents must not guess.

Repositories / DB
No new tables.

Add helper in libs/repositories/generations.ts:

countForUserSince(supabase, userId: string, isoDate: string): Promise<number>

UI
Add small component (e.g., components/credits/UsageBadge.tsx)

Fetch /api/v1/auth/me to get profile + price_id (if exposed) or a new lightweight endpoint (optional) /api/v1/credits/summary.

Display: X / CAP and an Upgrade button when at/over cap.

Add “Upgrade” links to existing endpoints:

/api/stripe/create-checkout

/api/stripe/create-portal

Keep these as thin bridges to v1 routes already present in repo.

Generate page shows an inline message when capped and disables submit.

Config
No edits to config.ts (guardrail). Central edit point = libs/constants/limits.ts.

5) Replicate usage
Unchanged. We simply block before starting when user is capped.

6) Constraints & Guardrails
No Server Actions; normalized JSON.

Credits enforcement must run server‑side (never trust client).

Race safety: with single in‑flight jobs and low volume, counting rows at submission time is fine. (If we ever need stricter atomicity later, we can add a usage table + deferrable unique transaction; not now.)

7) Acceptance Criteria
User under cap → submit works.

User at cap → 402 NO_CREDITS; UI shows upgrade CTA; button goes to Stripe checkout; after upgrading (webhook updates profiles.price_id), next submit passes.

“Remaining credits” badge visible in dashboard.

Build + greps green.

8) Artifacts
ai_docs/changes/PHASE_05__change_spec.md

ai_docs/reports/PHASE_05__qa-report.md

