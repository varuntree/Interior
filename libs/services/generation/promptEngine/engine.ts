import runtimeConfig from '@/libs/app-config/runtime'
import { DEFAULT_NEGATIVES } from './tokens'
import { redesignTemplate, stagingTemplate, composeTemplate, imagineTemplate } from './templates'
import { sanitizeAndClamp } from './sanitizer'
import type { PromptEngineConfig, PromptInput, PromptOutput } from './types'

// Internal util: resolve seeds by matching style/room against runtime presets and config maps
function resolveStyleSeed(style?: string): string | undefined {
  if (!style) return undefined
  // Try direct key in styleSeeds
  if (runtimeConfig.promptEngine?.styleSeeds?.[style]) return runtimeConfig.promptEngine.styleSeeds[style]
  // Try match by preset id or label
  const preset = runtimeConfig.presets.styles.find(s => s.id === style || s.label === style)
  if (preset?.promptSeed) return preset.promptSeed
  if (preset?.label) return undefined // do not inject label as seed (labels can include geo); prefer no seed
  return undefined
}

function resolveRoomSeed(room?: string): string | undefined {
  if (!room) return undefined
  // runtime roomSeeds mapping wins
  if (runtimeConfig.promptEngine?.roomSeeds?.[room]) return runtimeConfig.promptEngine.roomSeeds[room]
  // attempt to match preset id or label; if found, do not inject label text to avoid geo/context; only use mapping
  const preset = runtimeConfig.presets.roomTypes.find(r => r.id === room || r.label === room)
  return preset ? undefined : undefined
}

export function composePrompt(input: PromptInput, cfg?: PromptEngineConfig): PromptOutput {
  const engine = cfg ?? runtimeConfig.promptEngine
  const version = engine?.version || 'v2'
  const maxChars = engine?.maxChars || 320
  const negatives = engine?.negatives?.length ? engine.negatives : DEFAULT_NEGATIVES

  const styleSeed = resolveStyleSeed(input.style)
  const roomSeed = resolveRoomSeed(input.roomType)

  // If imagine has no user prompt, we still proceed with style/room seeds and base instruction
  const hadUserPrompt = !!(input.userPrompt && input.userPrompt.trim())

  const parts = ((): string[] => {
    const params = {
      styleSeed,
      roomSeed,
      user: hadUserPrompt ? input.userPrompt!.trim() : '',
      negatives,
    }
    switch (input.mode) {
      case 'redesign':
        return redesignTemplate(params)
      case 'staging':
        return stagingTemplate(params)
      case 'compose':
        return composeTemplate(params)
      case 'imagine':
      default:
        return imagineTemplate(params)
    }
  })()

  // Sanitize and clamp
  const { text, length } = sanitizeAndClamp(parts, maxChars)

  return { prompt: text, length, version, hadUserPrompt }
}


// re-export type for external imports
export type { PromptInput, PromptOutput, PromptEngineConfig } from './types'
