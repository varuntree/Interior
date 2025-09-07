// libs/services/external/googleNanoBananaAdapter.ts
// Adapter for Replicate google/nano-banana model.
// Exact schema per Replicate OpenAPI:
// Input: { prompt: string; image_input?: string[]; output_format?: 'jpg'|'png' }
// Output: a single image URL string

import type { GenerationRequest } from '@/libs/services/generation/types'

export interface GoogleNanoBananaInputs {
  prompt: string
  image_input?: string[]
  output_format?: 'jpg' | 'png'
}

export function toGoogleNanoBananaInputs(
  req: GenerationRequest,
  signedInputUrls: string[],
  opts?: { forceJpg?: boolean }
): GoogleNanoBananaInputs {
  const inputs: GoogleNanoBananaInputs = {
    prompt: req.prompt || '',
  }

  if (signedInputUrls && signedInputUrls.length > 0) {
    inputs.image_input = signedInputUrls
  }

  if (opts?.forceJpg) {
    inputs.output_format = 'jpg'
  }

  return inputs
}

