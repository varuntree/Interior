// Central, easy-to-edit plan caps (do not touch config.ts)
export const PLAN_LIMITS: Record<string, number> = {
  // 'price_xxx': 50,   // Starter (example)
  // 'price_yyy': 200,  // Advanced (example)
}

export const DEFAULT_FREE_CAP = 10   // applies when price_id is null/unknown

// Varun will edit these values; agents must not guess specific price IDs