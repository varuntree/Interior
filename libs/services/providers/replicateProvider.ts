import type {
  ProviderSubmitArgs,
  ProviderSubmitResult,
  ProviderStatusResult,
} from '@/libs/services/generation/types'
import { toGoogleNanoBananaInputs } from '@/libs/services/external/googleNanoBananaAdapter'
import { createPrediction, getPrediction } from '@/libs/services/external/replicateClient'
import { env } from '@/libs/env'

export function createReplicateProvider() {
  return {
    async submit(args: ProviderSubmitArgs): Promise<ProviderSubmitResult> {
      const { request, signedInputUrls, webhookUrl } = args

      const inputs = toGoogleNanoBananaInputs(request, signedInputUrls, { forceJpg: true })
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
