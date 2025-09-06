// libs/services/storage/uploads.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export interface UploadResult {
  // Path relative to the bucket (used for storage API calls)
  path: string;
  // Path stored in DB following convention: private/<userId>/inputs/<filename>
  dbPath: string;
  signedUrl: string;
}

export async function uploadGenerationInput(
  supabase: SupabaseClient,
  params: {
    userId: string;
    file: File | Blob;
    contentType?: string;
    fileName?: string;
  }
): Promise<UploadResult> {
  const { userId, file, contentType, fileName } = params;
  
  // Generate unique file path following convention: private/${userId}/inputs/<uuid>.<ext>
  const fileExtension = getFileExtension(fileName || 'image', contentType);
  const uniqueFileName = `${randomUUID()}${fileExtension}`;
  const storagePath = `${userId}/inputs/${uniqueFileName}`;
  
  // Upload to private bucket
  const { error: uploadError } = await supabase.storage
    .from('private')
    .upload(storagePath, file, {
      contentType: contentType || 'image/jpeg',
      upsert: false // Don't overwrite if exists
    });

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Generate signed URL for Replicate (5 minutes expiry)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('private')
    .createSignedUrl(storagePath, 300); // 5 minutes

  if (signedUrlError || !signedUrlData) {
    throw new Error(`Failed to create signed URL: ${signedUrlError?.message}`);
  }

  return {
    path: storagePath,
    dbPath: `private/${storagePath}`,
    signedUrl: signedUrlData.signedUrl
  };
}

export async function uploadMultipleInputs(
  supabase: SupabaseClient,
  params: {
    userId: string;
    files: Array<{ file: File | Blob; contentType?: string; fileName?: string }>;
  }
): Promise<UploadResult[]> {
  const { userId, files } = params;
  const results: UploadResult[] = [];

  for (const fileData of files) {
    const result = await uploadGenerationInput(supabase, {
      userId,
      ...fileData
    });
    results.push(result);
  }

  return results;
}

export async function createSignedUrlForPath(
  supabase: SupabaseClient,
  params: {
    bucket: string;
    path: string;
    expiresIn: number; // seconds
  }
): Promise<string> {
  const { bucket, path, expiresIn } = params;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data) {
    throw new Error(`Failed to create signed URL for ${path}: ${error?.message}`);
  }

  return data.signedUrl;
}

export function validateImageFile(file: File | Blob, fileName?: string): { valid: boolean; error?: string } {
  // Check file size (15MB limit from runtime config)
  const maxSize = 15 * 1024 * 1024; // 15MB in bytes
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` 
    };
  }

  // Check MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (file instanceof File) {
    if (!allowedMimeTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}` 
      };
    }
  }

  return { valid: true };
}

function getFileExtension(fileName: string, contentType?: string): string {
  // Try to get extension from filename first
  const fileNameExt = fileName.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/)?.[0];
  if (fileNameExt) {
    return fileNameExt;
  }

  // Fallback to content type
  switch (contentType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.jpg'; // Default fallback
  }
}

export async function deleteUploadedFile(
  supabase: SupabaseClient,
  params: {
    bucket: string;
    path: string;
  }
): Promise<void> {
  const { bucket, path } = params;

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.warn(`Failed to delete file ${path} from ${bucket}: ${error.message}`);
    // Don't throw error for cleanup operations
  }
}
