// Shared types for the generation service and providers
import type { Mode } from '@/libs/app-config/runtime'

export type ProviderStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'

export interface GenerationRequest {
  ownerId: string
  mode: Mode
  prompt?: string
  roomType?: string
  style?: string
  // Settings removed for google/nano-banana; legacy adapters must infer defaults
  input1Path?: string
  input2Path?: string
  idempotencyKey?: string
}

export interface ProviderSubmitArgs {
  request: GenerationRequest
  signedInputUrls: string[]
  webhookUrl: string
}

export interface ProviderSubmitResult {
  predictionId: string
  status: ProviderStatus
  createdAt?: string
}

export interface ProviderStatusResult {
  status: ProviderStatus
  error?: string
  completedAt?: string
}
