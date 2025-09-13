import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/libs/observability/logger'

export interface StorageStats {
  totalFiles: number
  totalSizeBytes: number
  inputFiles: number
  inputSizeBytes: number
  outputFiles: number
  outputSizeBytes: number
}

export interface UserStorageUsage {
  userId: string
  totalSizeBytes: number
  inputSizeBytes: number
  outputSizeBytes: number
  fileCount: number
  lastUpdated: string
}

export interface OrphanedAsset {
  bucket: string
  path: string
  sizeBytes: number
  createdAt: string
  reason: string
}

export async function calculateStorageUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStorageUsage> {
  // Get input files (private bucket)
  const { data: inputFiles, error: inputError } = await supabase.storage
    .from('private')
    .list(`${userId}/inputs`, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (inputError && inputError.message !== 'The resource was not found') {
    throw inputError
  }

  // Calculate input storage
  let inputSizeBytes = 0
  let inputFileCount = 0
  if (inputFiles) {
    inputFileCount = inputFiles.length
    inputSizeBytes = inputFiles.reduce((total, file) => total + (file.metadata?.size || 0), 0)
  }

  // Get user's renders to calculate output storage
  const { data: renders, error: rendersError } = await supabase
    .from('renders')
    .select('id')
    .eq('owner_id', userId)

  if (rendersError) throw rendersError

  let outputSizeBytes = 0
  let outputFileCount = 0

  if (renders && renders.length > 0) {
    // Calculate output storage from public bucket
    for (const render of renders) {
      const { data: outputFiles, error: outputError } = await supabase.storage
        .from('public')
        .list(`renders/${render.id}`, {
          limit: 100
        })

      if (outputError && outputError.message !== 'The resource was not found') {
        continue // Skip this render if we can't access it
      }

      if (outputFiles) {
        outputFileCount += outputFiles.length
        outputSizeBytes += outputFiles.reduce((total, file) => total + (file.metadata?.size || 0), 0)
      }
    }
  }

  return {
    userId,
    totalSizeBytes: inputSizeBytes + outputSizeBytes,
    inputSizeBytes,
    outputSizeBytes,
    fileCount: inputFileCount + outputFileCount,
    lastUpdated: new Date().toISOString()
  }
}

export async function getStorageStats(
  supabase: SupabaseClient
): Promise<StorageStats> {
  // This would typically be admin-only function
  // For now, return placeholder stats
  return {
    totalFiles: 0,
    totalSizeBytes: 0,
    inputFiles: 0,
    inputSizeBytes: 0,
    outputFiles: 0,
    outputSizeBytes: 0
  }
}

export async function generateBatchSignedUrls(
  supabase: SupabaseClient,
  files: Array<{ bucket: string; path: string }>,
  expiresIn = 3600
): Promise<Array<{ path: string; signedUrl: string | null; error?: string }>> {
  const results = []

  for (const file of files) {
    try {
      const { data, error } = await supabase.storage
        .from(file.bucket)
        .createSignedUrl(file.path, expiresIn)

      results.push({
        path: file.path,
        signedUrl: data?.signedUrl || null,
        error: error?.message
      })
    } catch (error) {
      results.push({
        path: file.path,
        signedUrl: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}

export async function findOrphanedAssets(
  supabase: SupabaseClient,
  userId?: string
): Promise<OrphanedAsset[]> {
  const orphaned: OrphanedAsset[] = []

  try {
    if (userId) {
      // Check user's input files
      await findOrphanedInputs(supabase, userId, orphaned)
      // Check user's output files
      await findOrphanedOutputs(supabase, userId, orphaned)
    } else {
      // System-wide orphan check (admin only)
      await findSystemWideOrphans(supabase, orphaned)
    }
  } catch (error) {
    logger.error('storage.orphan_scan_error', { message: (error as any)?.message })
  }

  return orphaned
}

async function findOrphanedInputs(
  supabase: SupabaseClient,
  userId: string,
  orphaned: OrphanedAsset[]
): Promise<void> {
  // Get all input files for user
  const { data: inputFiles } = await supabase.storage
    .from('private')
    .list(`${userId}/inputs`, { limit: 1000 })

  if (!inputFiles) return

  // Get all generation jobs for user that reference inputs
  const { data: jobs } = await supabase
    .from('generation_jobs')
    .select('input1_path, input2_path')
    .eq('owner_id', userId)
    .not('input1_path', 'is', null)

  const referencedPaths = new Set<string>()
  jobs?.forEach(job => {
    if (job.input1_path) referencedPaths.add(job.input1_path)
    if (job.input2_path) referencedPaths.add(job.input2_path)
  })

  // Find orphaned input files
  inputFiles.forEach(file => {
    const fullPath = `private/${userId}/inputs/${file.name}`
    if (!referencedPaths.has(fullPath)) {
      orphaned.push({
        bucket: 'private',
        path: fullPath,
        sizeBytes: file.metadata?.size || 0,
        createdAt: file.created_at || new Date().toISOString(),
        reason: 'Input file not referenced by any generation job'
      })
    }
  })
}

async function findOrphanedOutputs(
  supabase: SupabaseClient,
  userId: string,
  orphaned: OrphanedAsset[]
): Promise<void> {
  // Get all renders for user
  const { data: renders } = await supabase
    .from('renders')
    .select('id')
    .eq('owner_id', userId)

  if (!renders) return

  const validRenderIds = new Set(renders.map(r => r.id))

  // Check for output folders that don't correspond to valid renders
  const { data: outputFolders } = await supabase.storage
    .from('public')
    .list('renders', { limit: 1000 })

  if (!outputFolders) return

  for (const folder of outputFolders) {
    if (!validRenderIds.has(folder.name)) {
      // This folder doesn't correspond to a valid render
      const { data: files } = await supabase.storage
        .from('public')
        .list(`renders/${folder.name}`, { limit: 100 })

      files?.forEach(file => {
        orphaned.push({
          bucket: 'public',
          path: `renders/${folder.name}/${file.name}`,
          sizeBytes: file.metadata?.size || 0,
          createdAt: file.created_at || new Date().toISOString(),
          reason: 'Output file for deleted render'
        })
      })
    }
  }
}

async function findSystemWideOrphans(
  supabase: SupabaseClient,
  orphaned: OrphanedAsset[]
): Promise<void> {
  // This would be an admin function to find system-wide orphans
  // Implementation would depend on admin access patterns
  logger.info('storage.orphan_detection_not_implemented')
}

export async function cleanupOrphanedAssets(
  supabase: SupabaseClient,
  orphanedAssets: OrphanedAsset[]
): Promise<{
  deleted: number
  errors: Array<{ path: string; error: string }>
}> {
  const errors: Array<{ path: string; error: string }> = []
  let deleted = 0

  for (const asset of orphanedAssets) {
    try {
      const { error } = await supabase.storage
        .from(asset.bucket)
        .remove([asset.path.replace(`${asset.bucket}/`, '')])

      if (error) {
        errors.push({ path: asset.path, error: error.message })
      } else {
        deleted++
      }
    } catch (error) {
      errors.push({
        path: asset.path,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return { deleted, errors }
}

export async function validateFileType(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): Promise<{ valid: boolean; error?: string }> {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

export async function validateFileSize(
  file: File,
  maxSizeMB: number = 15
): Promise<{ valid: boolean; error?: string }> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of ${maxSizeMB}MB`
    }
  }

  return { valid: true }
}

export function generateStoragePath(
  userId: string,
  type: 'input' | 'output',
  filename: string,
  renderId?: string
): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)

  if (type === 'input') {
    const extension = filename.split('.').pop()
    return `private/${userId}/inputs/${timestamp}-${randomSuffix}.${extension}`
  } else {
    // Output files
    if (!renderId) {
      throw new Error('Render ID required for output files')
    }
    return `public/renders/${renderId}/${filename}`
  }
}

export function getPublicUrl(supabaseUrl: string, bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

export async function copyAsset(
  supabase: SupabaseClient,
  sourceBucket: string,
  sourcePath: string,
  destBucket: string,
  destPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Download from source
    const { data: sourceData, error: downloadError } = await supabase.storage
      .from(sourceBucket)
      .download(sourcePath)

    if (downloadError || !sourceData) {
      return { success: false, error: downloadError?.message || 'Failed to download source file' }
    }

    // Upload to destination
    const { error: uploadError } = await supabase.storage
      .from(destBucket)
      .upload(destPath, sourceData, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function moveAsset(
  supabase: SupabaseClient,
  sourceBucket: string,
  sourcePath: string,
  destBucket: string,
  destPath: string
): Promise<{ success: boolean; error?: string }> {
  // Copy the asset
  const copyResult = await copyAsset(supabase, sourceBucket, sourcePath, destBucket, destPath)

  if (!copyResult.success) {
    return copyResult
  }

  // Delete the source
  const { error: deleteError } = await supabase.storage
    .from(sourceBucket)
    .remove([sourcePath])

  if (deleteError) {
    return { success: false, error: `Copied successfully but failed to delete source: ${deleteError.message}` }
  }

  return { success: true }
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

export function estimateStorageCost(sizeBytes: number, pricePerGB: number = 0.021): number {
  const sizeGB = sizeBytes / (1024 * 1024 * 1024)
  return sizeGB * pricePerGB
}
