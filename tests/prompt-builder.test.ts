import { describe, it, expect } from 'vitest'
import { buildPrompt, validatePromptParams } from '../libs/services/generation/prompts'

describe('Prompt Builder', () => {
  it('includes structural guardrails for redesign', () => {
    const prompt = buildPrompt({ mode: 'redesign', roomType: 'Living room', style: 'coastal_au', userPrompt: 'airy, light timbers' })
    expect(prompt).toContain('Keep existing room architecture')
    expect(prompt).toContain('Australian homes')
  })

  it('requires user prompt for imagine', () => {
    const result = validatePromptParams({ mode: 'imagine', userPrompt: '' })
    expect(result.valid).toBe(false)
  })

  it('compose includes both image instructions', () => {
    const prompt = buildPrompt({ mode: 'compose', roomType: 'Bedroom', style: 'japandi', userPrompt: 'soft contrast' })
    expect(prompt).toContain('Use the first image as the base room')
    expect(prompt).toContain('Use the second image only as style/reference')
  })
})

