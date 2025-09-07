// libs/services/external/replicateAdapter.ts
import runtimeConfig from '@/libs/app-config/runtime';
import type { GenerationRequest } from '@/libs/services/generation/types'

export interface ReplicateInputs {
  openai_api_key: string;           // REQUIRED for gpt-image-1
  prompt: string;                    // REQUIRED
  input_images?: string[];           // Optional reference images (was 'image')
  aspect_ratio: string;              // Correct
  number_of_images: number;          // Was 'num_outputs'
  output_format?: string;            // Correct
  quality?: string;                  // Direct quality parameter
  background?: string;               // New optional parameter
  user_id?: string;                  // New optional for abuse monitoring
}

export function toReplicateInputs(
  req: GenerationRequest,
  signedInputUrls: string[],
  openaiApiKey: string
): ReplicateInputs {
  const { settings } = req;

  // Map aspect ratio to Replicate format
  const aspectRatioMapping: Record<GenerationRequest['settings']['aspectRatio'], string> = {
    '1:1': '1:1',
    '3:2': '3:2', 
    '2:3': '2:3'
  };

  const inputs: ReplicateInputs = {
    openai_api_key: openaiApiKey,     // REQUIRED for gpt-image-1
    prompt: req.prompt || '',
    aspect_ratio: aspectRatioMapping[settings.aspectRatio],
    number_of_images: Math.min(settings.variants, runtimeConfig.limits.maxVariantsPerRequest),
    output_format: 'webp',
    quality: settings.quality,         // Direct mapping, no conversion
    background: 'auto',                // Default to auto
    user_id: req.ownerId               // For abuse monitoring
  };

  // Add reference images if provided
  if (signedInputUrls.length > 0) {
    inputs.input_images = signedInputUrls;  // Changed from 'image'
  }

  return inputs;
}


export function buildWebhookUrl(baseUrl: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  return `${cleanBaseUrl}${runtimeConfig.replicate.webhookRelativePath}`;
}

export function mapReplicateStatus(status: string): 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled' {
  switch (status) {
    case 'starting':
    case 'processing':
    case 'succeeded':
    case 'failed':
    case 'canceled':
      return status;
    default:
      return 'processing'; // Default fallback
  }
}
