// Compat adapter for tests; runtime uses googleNanoBananaAdapter.
// Provides a stable surface expected by tests.

export function toReplicateInputs(
  req: any,
  signedInputUrls: string[] = [],
  openaiApiKey?: string
) {
  const variants = Math.min(Math.max(req?.settings?.variants ?? 1, 1), 3)
  const aspectRatio = req?.settings?.aspectRatio ?? '1:1'
  return {
    prompt: req?.prompt ?? '',
    aspect_ratio: aspectRatio,
    number_of_images: variants,
    input_images: signedInputUrls.length ? signedInputUrls : undefined,
    openai_api_key: openaiApiKey,
    user_id: req?.ownerId,
  }
}

export function buildWebhookUrl(baseUrl: string, path = '/api/v1/webhooks/replicate') {
  const base = baseUrl.replace(/\/$/, '')
  return `${base}${path}`
}

