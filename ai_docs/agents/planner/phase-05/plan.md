# Phase 05 Implementation Plan - Billing and Credits

## Scope

### What will change
- Add central plan limits config file (`libs/constants/limits.ts`) with monthly caps
- Modify generation submission endpoint to enforce credit checking
- Create credits service with plan cap resolution and usage counting 
- Add repository helper to count generations by user and time window
- Update generations service to call credit checking before job creation
- Optional API endpoint for credit summary UI display

### What will NOT change
- No new database tables (compute from existing generations table)
- No modification to `config.ts` (guardrail enforced)
- No changes to existing Stripe checkout/portal routes
- No proration display or detailed billing history
- No coupon UX features

## API Endpoints

### Modified Endpoints
- `POST /app/api/v1/generations/submit/route.ts`
  - Add credit enforcement before generation creation
  - Schema remains unchanged 
  - Returns 402 `NO_CREDITS` error when user is at monthly cap

### Optional New Endpoints
- `GET /app/api/v1/credits/summary/route.ts` (optional for UI)
  - Returns: `{ remainingCredits: number, monthlyLimit: number, planId: string }`
  - Auth required
  - Uses credits service to calculate remaining count

## Services & Repositories

### New Service: `libs/services/credits.ts`
- `getPlanCapForUser(ctx, { userId }): Promise<number>`
  - Loads user profile -> price_id -> lookup in PLAN_LIMITS -> return number
- `getUsageThisPeriod(ctx, { userId }): Promise<number>`
  - Query generations table since current month start  
- `checkAndConsumeCredit(ctx, { userId }): Promise<{ ok: true } | { ok: false; reason: 'NO_CREDITS' }>`
  - Combines plan cap and current usage to make decision

### Modified Service: `libs/services/generations.ts`
- Replace stub `checkUserHasCredits()` with real call to credits service
- Call credit check at top of `submitGeneration` flow before any processing

### Modified Repository: `libs/repositories/generations.ts`
- Add `countForUserSince(supabase, userId: string, isoDate: string): Promise<number>`
  - Count generation rows for user created since given ISO date

## Configuration

### New File: `libs/constants/limits.ts`
```typescript
// Central, easy-to-edit plan caps (do not touch config.ts)
export const PLAN_LIMITS: Record<string, number> = {
  // 'price_xxx': 50,   // Starter (example)
  // 'price_yyy': 200,  // Advanced (example)  
}
export const DEFAULT_FREE_CAP = 10   // applies when price_id is null/unknown
```

## UI Surfaces/Pages/Components

### Optional UI Enhancement
- Small component `components/credits/UsageBadge.tsx`
  - Display: "X / CAP generations used this month"
  - Show "Upgrade" button when at/over cap
  - Links to existing `/api/stripe/create-checkout`
- Update generate page to show inline message when capped and disable submit

## Replicate/OpenAI Usage
- No changes to Replicate integration
- Credits enforcement blocks generation before Replicate call starts
- Existing async webhook pattern unchanged

## Acceptance Criteria

1. **Credit Enforcement**
   - User under cap → submit generation works normally
   - User at cap → receives 402 response with `NO_CREDITS` error code
   - Error response includes upgrade message: "You've reached this month's generation limit. Upgrade to continue."

2. **Plan Resolution**
   - Users with no price_id get DEFAULT_FREE_CAP (10 generations)  
   - Users with valid price_id get mapped limit from PLAN_LIMITS
   - Unknown price_id falls back to DEFAULT_FREE_CAP

3. **Usage Counting**
   - Monthly period calculated as UTC calendar month (date_trunc('month', now()))
   - Count includes all generation records created in current month
   - Count is accurate regardless of generation status (processing/succeeded/failed)

4. **UI Integration**
   - Generate page shows usage badge (if implemented)
   - Upgrade CTA connects to existing Stripe checkout flow
   - After successful upgrade (webhook updates price_id), next submit passes

5. **Technical Quality**
   - `npm run build` passes without errors
   - No Server Actions introduced
   - Credits enforcement runs server-side only
   - All grep checks from Handbook return 0 forbidden matches

## Constraints & Guardrails

- **No Server Actions**: All credit checking via API routes
- **No config.ts edits**: Central limits stored in separate constants file
- **Server-side enforcement**: Never trust client for credit validation
- **Race safety**: Single in-flight jobs + monthly counting sufficient for current volume
- **RLS compliance**: Use existing user-scoped client for profile reads

## Replicate Usage Patterns
- Unchanged from current implementation
- Credit check occurs before Replicate prediction creation
- Failed credit check prevents any Replicate API calls
- Webhook processing remains identical

## Risks & Mitigations

- **Race condition on monthly boundary**: Low risk with current volume; single in-flight rule provides protection
- **Plan limits not configured**: Default free cap provides fallback
- **Price ID mapping errors**: Graceful fallback to free tier limits

## Implementation Sequence

1. Create `libs/constants/limits.ts` with empty config and defaults
2. Add repository helper for counting generations by user/period  
3. Implement credits service with plan resolution and usage calculation
4. Modify generations service to replace stub credit check
5. Update generation submit route to handle new error responses
6. Optional: Add credits summary API endpoint
7. Optional: Create usage badge UI component

---

**HANDOFF**: spec-executor  
**ARTIFACTS**:
- `/Users/varunprasad/Desktop/Interior/ai_docs/agents/planner/phase-05/plan.md`
- `/Users/varunprasad/Desktop/Interior/ai_docs/agents/planner/phase-05/change_spec.md`