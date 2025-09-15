import { describe, it, expect } from 'vitest'
import { composePrompt } from '../libs/services/generation/promptEngine/engine'

describe('Prompt Engine v2 (generalized)', () => {
  it('redesign includes structure guardrails and negatives, no geo context', () => {
    const out = composePrompt({ mode: 'redesign', roomType: 'Living Room', style: 'coastal_au', userPrompt: 'airy, light timbers' })
    expect(out.prompt.toLowerCase()).toContain('keep the existing room architecture')
    expect(out.prompt.toLowerCase()).toContain('no people')
    expect(out.prompt.toLowerCase()).not.toContain('australi')
  })

  it('staging emphasizes furnishing and retains color mood', () => {
    const out = composePrompt({ mode: 'staging', roomType: 'Bedroom', style: 'contemporary_au', userPrompt: 'warm neutrals' })
    expect(out.prompt.toLowerCase()).toContain('under-furnished')
    expect(out.prompt.toLowerCase()).toContain('retain the overall color mood')
  })

  it('compose instructs base vs reference and harmonize', () => {
    const out = composePrompt({ mode: 'compose', roomType: 'Dining Room', style: 'japandi', userPrompt: 'soft contrast' })
    expect(out.prompt.toLowerCase()).toContain('use the first image as the base room')
    expect(out.prompt.toLowerCase()).toContain('use the second image')
    expect(out.prompt.toLowerCase()).toContain('harmonize lighting')
  })

  it('imagine works without user prompt and bans humans', () => {
    const out = composePrompt({ mode: 'imagine', roomType: 'Home Office', style: 'minimal_au' })
    expect(out.hadUserPrompt).toBe(false)
    expect(out.prompt.toLowerCase()).toContain('interior scene')
    expect(out.prompt.toLowerCase()).toContain('no humans')
    expect(out.length).toBeLessThanOrEqual(400)
  })
})

