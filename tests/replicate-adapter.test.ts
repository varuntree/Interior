import { describe, it, expect } from 'vitest'
import { toReplicateInputs, buildWebhookUrl } from '../libs/services/external/replicateAdapter'

const ownerId = 'user-123'

describe('Replicate Adapter', () => {
  it('maps aspect ratios and clamps variants', () => {
    const req = {
      ownerId,
      mode: 'redesign',
      prompt: 'test',
      settings: { aspectRatio: '3:2', quality: 'auto', variants: 10 },
    } as any
    const inputs = toReplicateInputs(req, [], 'sk-test')
    expect(inputs.aspect_ratio).toBe('3:2')
    // runtimeConfig default caps at 3
    expect(inputs.number_of_images).toBeLessThanOrEqual(3)
    expect(inputs.openai_api_key).toBe('sk-test')
    expect(inputs.user_id).toBe(ownerId)
  })

  it('passes input images when provided', () => {
    const req = {
      ownerId,
      mode: 'compose',
      prompt: 'merge',
      settings: { aspectRatio: '1:1', quality: 'high', variants: 2 },
    } as any
    const urls = ['https://example.com/a.webp', 'https://example.com/b.webp']
    const inputs = toReplicateInputs(req, urls, 'sk-test')
    expect(inputs.input_images).toEqual(urls)
  })

  it('builds webhook URL without double slash', () => {
    expect(buildWebhookUrl('https://site.com/')).toMatch(/https:\/\/site\.com\//)
  })
})

