import { describe, it, expect } from 'vitest'
import { normalizeWebhookOutput } from '../libs/services/generation_webhooks'

describe('Webhook output normalization', () => {
  it('normalizes string to array', () => {
    const out = normalizeWebhookOutput('https://replicate.delivery/output.jpg')
    expect(out).toEqual(['https://replicate.delivery/output.jpg'])
  })

  it('keeps array as array', () => {
    const out = normalizeWebhookOutput(['a', 'b'])
    expect(out).toEqual(['a','b'])
  })

  it('handles null/undefined', () => {
    expect(normalizeWebhookOutput(null as any)).toEqual([])
    expect(normalizeWebhookOutput(undefined)).toEqual([])
  })
})

