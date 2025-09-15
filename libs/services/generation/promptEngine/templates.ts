import { COMPOSE_HINTS, IMAGINE_BASE, STAGING_HINTS, STRUCTURE_GUARDRAILS } from './tokens'

type Parts = {
  styleSeed?: string
  roomSeed?: string
  user?: string
  negatives: string[]
}

function negativesText(negatives: string[]) {
  // Keep negatives concise
  if (!negatives || negatives.length === 0) return ''
  return `(${negatives.join(', ')})`
}

export function redesignTemplate(p: Parts): string[] {
  return [
    STRUCTURE_GUARDRAILS,
    'Restyle furnishings, decor, color palette and finishes.',
    p.styleSeed ? `Style: ${p.styleSeed}.` : '',
    p.roomSeed ? `Room type: ${p.roomSeed}.` : '',
    p.user || '',
    negativesText(p.negatives),
  ]
}

export function stagingTemplate(p: Parts): string[] {
  return [
    STRUCTURE_GUARDRAILS,
    STAGING_HINTS,
    p.styleSeed ? `Style: ${p.styleSeed}.` : '',
    p.roomSeed ? `Room type: ${p.roomSeed}.` : '',
    p.user || '',
    negativesText(p.negatives),
  ]
}

export function composeTemplate(p: Parts): string[] {
  return [
    COMPOSE_HINTS,
    p.styleSeed ? `Style: ${p.styleSeed}.` : '',
    p.roomSeed ? `Room type: ${p.roomSeed}.` : '',
    p.user || '',
    negativesText(p.negatives),
  ]
}

export function imagineTemplate(p: Parts): string[] {
  return [
    IMAGINE_BASE,
    p.styleSeed ? `Style: ${p.styleSeed}.` : '',
    p.roomSeed ? `Room type: ${p.roomSeed}.` : '',
    p.user || '',
    negativesText(p.negatives),
  ]
}

