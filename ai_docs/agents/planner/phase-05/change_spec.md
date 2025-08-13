# CHANGE SPEC — Phase 05 Billing and Credits Implementation

## 1) Title
Add central plan limits configuration and server-side credit enforcement for monthly generation caps.

## 2) Scope
- Add central plan limits config file outside of config.ts guardrail
- Implement credits service for plan cap resolution and usage counting
- Modify generation service to enforce real credit checking
- Add repository helper for monthly generation counting
- Optional credits summary API endpoint for UI display

We will NOT:
- Create new database tables (use existing generations table)
- Modify config.ts (guardrail enforced)
- Change existing Stripe checkout/portal routes
- Add detailed billing history or proration features

## 3) Do-Not-Touch List (from handbook §0)
- Keep these files intact:
  - app/layout.tsx, app/page.tsx, app/error.tsx, app/not-found.tsx
  - app/signin/**/*, app/dashboard/**/*, app/blog/**/*, app/privacy-policy/page.tsx, app/tos/page.tsx
  - app/api/auth/callback/route.ts
  - app/api/stripe/create-checkout/route.ts
  - app/api/stripe/create-portal/route.ts
  - app/api/webhook/stripe/route.ts
  - middleware.ts, config.ts, components/**/*, libs/**/*, types/**/*

## 4) File Operations

### 4.1 Add

- `libs/constants/limits.ts`
  - Content:
```typescript
// Central, easy-to-edit plan caps (do not touch config.ts)
export const PLAN_LIMITS: Record<string, number> = {
  // 'price_xxx': 50,   // Starter (example)
  // 'price_yyy': 200,  // Advanced (example)
}

export const DEFAULT_FREE_CAP = 10   // applies when price_id is null/unknown

// Varun will edit these values; agents must not guess specific price IDs
```

- `libs/services/credits.ts`
  - Content:
```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import * as profilesRepo from '@/libs/repositories/profiles'
import * as generationsRepo from '@/libs/repositories/generations'
import { PLAN_LIMITS, DEFAULT_FREE_CAP } from '@/libs/constants/limits'

export interface CreditsContext {
  supabase: SupabaseClient;
}

/**
 * Get monthly generation cap for user based on their plan
 */
export async function getPlanCapForUser(
  ctx: CreditsContext,
  args: { userId: string }
): Promise<number> {
  const { supabase } = ctx;
  const { userId } = args;

  try {
    const profile = await profilesRepo.getProfileById(supabase, userId);
    
    // If user has no price_id or it's not in our limits config, use default free cap
    if (!profile.price_id || !PLAN_LIMITS[profile.price_id]) {
      return DEFAULT_FREE_CAP;
    }

    return PLAN_LIMITS[profile.price_id];
  } catch (error) {
    // If profile lookup fails, default to free cap for safety
    return DEFAULT_FREE_CAP;
  }
}

/**
 * Get user's generation usage for current month period
 */
export async function getUsageThisPeriod(
  ctx: CreditsContext,
  args: { userId: string }
): Promise<number> {
  const { supabase } = ctx;
  const { userId } = args;

  // Calculate current month start in UTC
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthStartISO = monthStart.toISOString();

  try {
    const count = await generationsRepo.countForUserSince(supabase, userId, monthStartISO);
    return count;
  } catch (error) {
    // If count fails, assume zero usage to allow operations
    console.warn('Failed to get usage count:', error);
    return 0;
  }
}

/**
 * Check if user can consume a credit for generation
 */
export async function checkAndConsumeCredit(
  ctx: CreditsContext,
  args: { userId: string }
): Promise<{ ok: true } | { ok: false; reason: 'NO_CREDITS' }> {
  const { userId } = args;

  try {
    const [planCap, currentUsage] = await Promise.all([
      getPlanCapForUser(ctx, { userId }),
      getUsageThisPeriod(ctx, { userId })
    ]);

    if (currentUsage >= planCap) {
      return { ok: false, reason: 'NO_CREDITS' };
    }

    return { ok: true };
  } catch (error) {
    // On error, deny to be safe
    console.error('Credit check failed:', error);
    return { ok: false, reason: 'NO_CREDITS' };
  }
}

/**
 * Get credits summary for UI display
 */
export async function getCreditsSummary(
  ctx: CreditsContext,
  args: { userId: string }
): Promise<{ remainingCredits: number; monthlyLimit: number; planId: string | null }> {
  const { supabase } = ctx;
  const { userId } = args;

  try {
    const [profile, planCap, currentUsage] = await Promise.all([
      profilesRepo.getProfileById(supabase, userId),
      getPlanCapForUser(ctx, { userId }),
      getUsageThisPeriod(ctx, { userId })
    ]);

    const remainingCredits = Math.max(0, planCap - currentUsage);

    return {
      remainingCredits,
      monthlyLimit: planCap,
      planId: profile.price_id
    };
  } catch (error) {
    // Return safe defaults on error
    return {
      remainingCredits: 0,
      monthlyLimit: DEFAULT_FREE_CAP,
      planId: null
    };
  }
}
```

- `app/api/v1/credits/summary/route.ts`
  - Content:
```typescript
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/handler'
import { ok, fail } from '@/libs/api-utils/responses'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { getCreditsSummary } from '@/libs/services/credits'

export const GET = withMethods(['GET'], async (req: NextRequest) => {
  try {
    const supabase = createServiceSupabaseClient()
    
    // Get current user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const summary = await getCreditsSummary({ supabase }, { userId: user.id })

    return ok(summary)
  } catch (err: any) {
    return fail(500, 'INTERNAL_ERROR', err?.message ?? 'Unexpected error')
  }
})
```

### 4.2 Modify

- `libs/repositories/generations.ts`
  - Change: Add `countForUserSince` function after existing functions
  - Patch:
```diff
+/**
+ * Count generations for user created since given date
+ */
+export async function countForUserSince(
+  supabase: SupabaseClient,
+  userId: string,
+  sinceDate: string
+): Promise<number> {
+  const { count, error } = await supabase
+    .from('generations')
+    .select('id', { count: 'exact', head: true })
+    .eq('owner_id', userId)
+    .gte('created_at', sinceDate);
+
+  if (error) {
+    throw new Error(`Failed to count generations: ${error.message}`);
+  }
+
+  return count || 0;
+}
```

- `libs/services/generations.ts`
  - Change: Replace stub credit check with real implementation
  - Patch: Replace the stub function and update the call:
```diff
-/**
- * Stub credits check - always returns true for Phase 3
- * Will be replaced with real implementation in Phase 5
- */
-export async function checkUserHasCredits(userId: string): Promise<boolean> {
-  return true;
-}
+import * as creditsService from '@/libs/services/credits';

// Remove the checkUserHasCredits function entirely

// In submitGeneration function, replace:
-  // Check credits (stubbed for now)
-  const hasCredits = await checkUserHasCredits(userId);
-  if (!hasCredits) {
-    const error = new Error('Upgrade or wait for reset.');
-    (error as any).code = 'LIMIT_EXCEEDED';
-    (error as any).status = 402;
-    throw error;
-  }
+  // Check credits with real implementation
+  const creditCheck = await creditsService.checkAndConsumeCredit(ctx, { userId });
+  if (!creditCheck.ok) {
+    const error = new Error("You've reached this month's generation limit. Upgrade to continue.");
+    (error as any).code = 'NO_CREDITS';
+    (error as any).status = 402;
+    throw error;
+  }
```

## 5) Implementation Notes
- Plan limits configuration deliberately empty - Varun will populate with actual Stripe price IDs
- Credit checking uses existing user-scoped Supabase client (RLS enforced)
- Monthly period calculation uses UTC calendar months for consistency
- Count includes all generation records regardless of status (processing/succeeded/failed)
- Graceful error handling with safe fallbacks to free tier limits
- No Server Actions used - all enforcement server-side via API routes

## 6) Post-Apply Checks (agent must run)

1. `npm run build` passes without errors or warnings
2. Grep checks return 0 forbidden patterns:
   - `grep -R "use server" app libs` → 0
   - `grep -R "createServerClient" components` → 0  
   - `grep -R "service_role" app components` → 0
3. Test new credits summary endpoint:
   - GET `/api/v1/credits/summary` with auth returns JSON with `{ remainingCredits, monthlyLimit, planId }`
   - GET `/api/v1/credits/summary` without auth returns 401
4. Test generation submission:
   - POST `/api/v1/generations/submit` should work normally when under cap
   - With DEFAULT_FREE_CAP set to low value, verify 402 response after limit reached
5. Existing guardrail routes still reachable:
   - `/` (home), `/signin`, `/dashboard`, `/privacy-policy`, `/tos`, `/blog`
6. Legacy Stripe routes still respond:
   - `/api/stripe/create-checkout`, `/api/stripe/create-portal`

## 7) Rollback Plan
- Remove added files:
  - `libs/constants/limits.ts`
  - `libs/services/credits.ts`
  - `app/api/v1/credits/summary/route.ts`
- Revert modified files to previous content:
  - Restore stub `checkUserHasCredits` function in `libs/services/generations.ts`
  - Remove `countForUserSince` function from `libs/repositories/generations.ts`
- Confirm `npm run build` still passes after rollback