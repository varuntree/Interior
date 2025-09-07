import type {
  GenerationRequest,
  ProviderStatusResult,
  ProviderSubmitArgs,
  ProviderSubmitResult,
} from '@/libs/services/generation/types'
import { createReplicateProvider } from '@/libs/services/providers/replicateProvider'

export interface GenerationProvider {
  submit(args: ProviderSubmitArgs): Promise<ProviderSubmitResult>
  getStatus(predictionId: string): Promise<ProviderStatusResult>
  cancel?(predictionId: string): Promise<void>
}

export function getGenerationProvider(): GenerationProvider {
  // For now, we always use Replicate. Later, choose based on config.
  return createReplicateProvider()
}

export type { GenerationRequest, ProviderSubmitArgs, ProviderSubmitResult, ProviderStatusResult }

