// Generalized prompt tokens with no country/region context

export const STRUCTURE_GUARDRAILS = [
  'Photoreal interior render with correct perspective and realistic lighting.',
  'Keep the existing room architecture: walls, windows, doors, floors and layout unchanged.',
  'Do not alter structural layout, camera/view direction, or window positions.'
].join(' ')

export const STAGING_HINTS = [
  'Assume the room may be empty or under-furnished.',
  'Add tasteful furniture and decor to complete the space.',
  'Retain the overall color mood and lighting of the original photo.'
].join(' ')

export const COMPOSE_HINTS = [
  'Use the first image as the base room and keep its architecture intact.',
  'Use the second image strictly as a style or object reference.',
  'Transfer palette, materials, or the referenced object; harmonize lighting and perspective.'
].join(' ')

export const IMAGINE_BASE = [
  'Generate a photoreal interior scene with balanced composition and realistic materials.',
].join(' ')

// Negative constraints embedded directly in prompt text (model has no negative_prompt)
export const DEFAULT_NEGATIVES = [
  'no people', 'no humans', 'no person', 'no faces',
  'no text', 'no captions', 'no watermark', 'no logos'
]

