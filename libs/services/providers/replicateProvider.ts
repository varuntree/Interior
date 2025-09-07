import type {
  ProviderSubmitArgs,
  ProviderSubmitResult,
  ProviderStatusResult,
} from '@/libs/services/generation/types'
import { toReplicateInputs } from '@/libs/services/external/replicateAdapter'
import { createPrediction, getPrediction } from '@/libs/services/external/replicateClient'
import { env } from '@/libs/env'

export function createReplicateProvider() {
  return {
    async submit(args: ProviderSubmitArgs): Promise<ProviderSubmitResult> {
      const { request, signedInputUrls, webhookUrl } = args

      if (!env.server.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required for image generation')
      }

      const inputs = toReplicateInputs(request, signedInputUrls, env.server.OPENAI_API_KEY)
      const prediction = await createPrediction({
        inputs,
        webhookUrl,
        idempotencyKey: request.idempotencyKey,
      })

      return {
        predictionId: prediction.id,
        status: prediction.status as ProviderStatusResult['status'],
        createdAt: prediction.created_at,
      }
    },

    async getStatus(predictionId: string): Promise<ProviderStatusResult> {
      const prediction = await getPrediction(predictionId)
      return {
        status: prediction.status as ProviderStatusResult['status'],
        error: prediction.error,
        completedAt: prediction.completed_at,
      }
    },
  }
}

