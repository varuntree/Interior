// Simple sanitizer and length budgeter for prompts

export function sanitizeAndClamp(parts: string[], maxChars: number): { text: string; length: number } {
  // Join parts, drop empties
  let text = parts.filter(Boolean).map(s => s.trim()).filter(Boolean).join(' ')

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim()

  // Remove repeated punctuation
  text = text.replace(/([.,;:])\1+/g, '$1')

  if (text.length <= maxChars) {
    return { text, length: text.length }
  }

  // Clamp by removing least critical tail segments heuristically
  // Strategy: prefer keeping guardrails/instructions at the start and negatives at the end
  // We iteratively remove from the middle (user text first) by splitting on sentences
  const sentences = text.split(/(?<=[.!?])\s+/)

  while (sentences.join(' ').length > maxChars && sentences.length > 1) {
    // Remove the second to last sentence (likely user or seed detail), keep first and last
    const idx = Math.max(1, sentences.length - 2)
    sentences.splice(idx, 1)
  }

  let clamped = sentences.join(' ')
  if (clamped.length > maxChars) {
    clamped = clamped.slice(0, maxChars)
    // avoid cutting mid-word
    const lastSpace = clamped.lastIndexOf(' ')
    if (lastSpace > 0) clamped = clamped.slice(0, lastSpace)
  }

  return { text: clamped.trim(), length: clamped.trim().length }
}

