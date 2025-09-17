import { beforeAll, describe, it, expect } from 'vitest'
import type Stripe from 'stripe'

let inferPlanType: typeof import('../libs/services/billing').inferPlanType

beforeAll(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'public-anon-key'
  process.env.PUBLIC_BASE_URL ||= 'https://example.com'
  const mod = await import('../libs/services/billing')
  inferPlanType = mod.inferPlanType
})

describe('inferPlanType', () => {
  const basePrice = (overrides: Partial<Stripe.Price>): Stripe.Price => ({
    id: 'price_test',
    object: 'price',
    active: true,
    billing_scheme: 'per_unit',
    created: 0,
    currency: 'aud',
    currency_options: null,
    custom_unit_amount: null,
    livemode: false,
    lookup_key: null,
    metadata: {},
    nickname: null,
    product: 'prod_test',
    recurring: null,
    tax_behavior: 'exclusive',
    tiers_mode: null,
    transform_quantity: null,
    type: 'recurring',
    unit_amount: 2000,
    unit_amount_decimal: '2000',
    ...overrides,
  } as Stripe.Price)

  it('returns weekly when nickname hints weekly', () => {
    const price = basePrice({ nickname: 'Weekly starter', recurring: { aggregate_usage: null, interval: 'week', interval_count: 1, trial_period_days: null, usage_type: 'licensed' } })
    expect(inferPlanType(price)).toBe('weekly')
  })

  it('returns monthly for monthly recurring interval', () => {
    const price = basePrice({ nickname: 'Monthly plan', recurring: { aggregate_usage: null, interval: 'month', interval_count: 1, trial_period_days: null, usage_type: 'licensed' } })
    expect(inferPlanType(price)).toBe('monthly')
  })

  it('returns one_time when price type is one_time', () => {
    const price = basePrice({ type: 'one_time', recurring: null })
    expect(inferPlanType(price)).toBe('one_time')
  })

  it('returns unknown otherwise', () => {
    const price = basePrice({ nickname: 'Custom', recurring: { aggregate_usage: null, interval: 'year', interval_count: 1, trial_period_days: null, usage_type: 'licensed' } })
    expect(inferPlanType(price)).toBe('unknown')
  })
})
