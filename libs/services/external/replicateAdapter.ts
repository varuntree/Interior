// libs/services/external/replicateAdapter.ts
import type { AspectRatio, Quality, Mode } from '@/libs/app-config/runtime';
import runtimeConfig from '@/libs/app-config/runtime';

export interface GenerationRequest {
  ownerId: string;
  mode: Mode;
  prompt?: string;
  roomType?: string;
  style?: string;
  settings: {
    aspectRatio: AspectRatio;
    quality: Quality;
    variants: number;
  };
  input1Path?: string;
  input2Path?: string;
  idempotencyKey?: string;
}

export interface ReplicateInputs {
  prompt: string;
  image?: string[];
  aspect_ratio: string;
  num_outputs: number;
  output_format?: string;
  output_quality?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
}

export function toReplicateInputs(
  req: GenerationRequest,
  signedInputUrls: string[]
): ReplicateInputs {
  const { settings } = req;

  // Map aspect ratio to Replicate format
  const aspectRatioMapping: Record<AspectRatio, string> = {
    '1:1': '1:1',
    '3:2': '3:2', 
    '2:3': '2:3'
  };

  // Map quality to inference steps and guidance
  const qualitySettings = getQualitySettings(settings.quality);

  const inputs: ReplicateInputs = {
    prompt: req.prompt || '',
    aspect_ratio: aspectRatioMapping[settings.aspectRatio],
    num_outputs: Math.min(settings.variants, runtimeConfig.limits.maxVariantsPerRequest),
    output_format: 'webp',
    ...qualitySettings
  };

  // Add images for modes that require them
  if (signedInputUrls.length > 0) {
    inputs.image = signedInputUrls;
  }

  return inputs;
}

function getQualitySettings(quality: Quality): Partial<ReplicateInputs> {
  switch (quality) {
    case 'low':
      return {
        output_quality: 80,
        guidance_scale: 7.5,
        num_inference_steps: 20
      };
    case 'medium':
      return {
        output_quality: 90,
        guidance_scale: 7.5,
        num_inference_steps: 30
      };
    case 'high':
      return {
        output_quality: 95,
        guidance_scale: 9.0,
        num_inference_steps: 50
      };
    case 'auto':
    default:
      return {
        output_quality: 90,
        guidance_scale: 7.5,
        num_inference_steps: 30
      };
  }
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