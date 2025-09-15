import type { Mode } from '@/libs/app-config/runtime'

export type PromptInput = {
  mode: Mode
  roomType?: string
  style?: string // label or id; engine will try to resolve seed by either
  userPrompt?: string
}

export type PromptOutput = {
  prompt: string
  length: number
  version: string
  hadUserPrompt: boolean
}

export type ModeDefaults = {
  redesign: { includeStructureGuardrails: boolean }
  staging: { retainColorMood: boolean }
  compose: { enforceBaseVsReference: boolean }
  imagine: { enforceInteriorOnly: boolean; fallbackStyleId?: string; fallbackRoomTypeId?: string }
}

export type PromptEngineConfig = {
  version: string
  maxChars: number
  negatives: string[]
  modeDefaults: ModeDefaults
  styleSeeds: Record<string, string>
  roomSeeds?: Record<string, string>
}

