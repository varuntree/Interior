// libs/services/storage/assets.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import * as rendersRepo from '@/libs/repositories/renders';
import * as jobsRepo from '@/libs/repositories/generation_jobs';

export interface ProcessAssetsParams {
  jobId: string;
  predictionId: string;
  outputUrls: string[];
}

export interface ProcessedAsset {
  index: number;
  imagePath: string;
  thumbPath?: string;
}

export interface AssetProcessingError {
  type: 'DOWNLOAD_FAILED' | 'STORAGE_FAILED' | 'DATABASE_FAILED' | 'VALIDATION_FAILED';
  message: string;
  jobId: string;
  predictionId: string;
  retryable: boolean;
}

export interface ProcessingResult {
  success: boolean;
  renderId?: string;
  variantsCreated: number;
  errors: AssetProcessingError[];
}

export async function processGenerationAssets(
  supabase: SupabaseClient,
  params: ProcessAssetsParams
): Promise<void> {
  const { jobId, predictionId, outputUrls } = params;

  // Find the job
  const job = await jobsRepo.findJobByPredictionId(supabase, predictionId);
  if (!job) {
    throw new Error(`Job not found for prediction ${predictionId}`);
  }

  // Idempotency: reuse existing render for this job if present
  const existingRender = await rendersRepo.findRenderByJobId(supabase, jobId, job.owner_id)
  const render = existingRender || await rendersRepo.createRender(supabase, {
    job_id: jobId,
    owner_id: job.owner_id,
    mode: job.mode,
    room_type: job.room_type,
    style: job.style,
    cover_variant: 0 // First variant as cover
  });

  // Process each output URL
  const processedAssets: ProcessedAsset[] = [];
  
  for (let i = 0; i < outputUrls.length; i++) {
    const outputUrl = outputUrls[i];
    
    try {
      // If a variant already exists for this index, skip creating it (idempotent)
      const existingVariant = await rendersRepo.findVariantByRenderAndIdx(supabase, render.id, i)
      let asset: ProcessedAsset | null = null

      if (!existingVariant) {
        asset = await downloadAndStoreAsset(supabase, {
          renderId: render.id,
          index: i,
          sourceUrl: outputUrl
        });

        // Create variant record
        await rendersRepo.addVariant(supabase, {
          render_id: render.id,
          owner_id: job.owner_id,
          idx: i,
          image_path: asset.imagePath,
          thumb_path: asset.thumbPath
        });
      } else {
        // Already present; treat as processed
        asset = { index: i, imagePath: existingVariant.image_path, thumbPath: existingVariant.thumb_path || undefined }
      }
      
      processedAssets.push(asset);
    } catch (error) {
      console.error(`Failed to process asset ${i} for render ${render.id}:`, error);
      // Continue processing other assets even if one fails
    }
  }

  // If no assets processed and no existing render variants, consider it a failure; otherwise be idempotent
  if (processedAssets.length === 0) {
    const existingVariants = await rendersRepo.getVariantsByRender(supabase, render.id)
    if (!existingVariants || existingVariants.length === 0) {
      throw new Error('No assets were successfully processed');
    }
  }
}

export async function downloadAndStoreAsset(
  supabase: SupabaseClient,
  params: {
    renderId: string;
    index: number;
    sourceUrl: string;
  }
): Promise<ProcessedAsset> {
  const { renderId, index, sourceUrl } = params;

  // Download the image from Replicate with retry and timeout
  const imageBlob = await withRetry(async () => {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 20_000)
    try {
      const res = await fetch(sourceUrl, { signal: ac.signal })
      if (!res.ok) throw new Error(`download ${res.status} ${res.statusText}`)
      const buf = await res.arrayBuffer()
      // Target format: jpg only
      const mime = 'image/jpeg'
      return new Blob([buf], { type: mime })
    } finally {
      clearTimeout(t)
    }
  }, 3, 500)

  // Storage path: public/renders/${renderId}/${index}.<ext>
  const imagePath = `renders/${renderId}/${index}.jpg`;

  // Upload main image to public bucket
  const uploadAttempt = async () => {
    const { error } = await supabase.storage
      .from('public')
      .upload(imagePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });
    if (error) {
      // Treat "already exists" as success for idempotency
      const msg = String(error.message || '').toLowerCase()
      if (msg.includes('already exists') || msg.includes('duplicate')) return
      throw new Error(error.message)
    }
  }

  await withRetry(uploadAttempt, 3, 500)

  // For MVP, we'll skip thumbnail generation to keep it simple
  // Thumbnails can be generated on-demand via CSS or added later

  return {
    index,
    imagePath,
    // thumbPath: `renders/${renderId}/${index}_thumb.webp` // Skip for MVP
  };
}

export async function getAssetUrls(
  supabase: SupabaseClient,
  imagePath: string,
  thumbPath?: string
): Promise<{ imageUrl: string; thumbUrl?: string }> {
  // For public bucket, we can construct direct URLs or use signed URLs
  // Since these are in public bucket, we'll use direct URLs
  const { data } = supabase.storage.from('public').getPublicUrl(imagePath);
  const imageUrl = data.publicUrl;

  let thumbUrl: string | undefined;
  if (thumbPath) {
    const { data: thumbData } = supabase.storage.from('public').getPublicUrl(thumbPath);
    thumbUrl = thumbData.publicUrl;
  }

  return { imageUrl, thumbUrl };
}

export async function cleanupFailedAssets(
  supabase: SupabaseClient,
  renderId: string
): Promise<void> {
  // Get all variants for this render
  const { data: variants } = await supabase
    .from('render_variants')
    .select('image_path, thumb_path')
    .eq('render_id', renderId);

  if (!variants) return;

  // Delete assets from storage
  const pathsToDelete = variants
    .flatMap(v => [v.image_path, v.thumb_path])
    .filter(Boolean);

  if (pathsToDelete.length > 0) {
    const { error } = await supabase.storage
      .from('public')
      .remove(pathsToDelete);

    if (error) {
      console.warn(`Failed to cleanup assets for render ${renderId}:`, error.message);
    }
  }

  // Delete variant records (render will be cascade deleted)
  await supabase
    .from('render_variants')
    .delete()
    .eq('render_id', renderId);
}

// Utility function to validate image URLs
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && 
           (parsed.pathname.endsWith('.jpg') || 
            parsed.pathname.endsWith('.png') || 
            parsed.pathname.endsWith('.webp'));
  } catch {
    return false;
  }
}

// Retry wrapper for network operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}
