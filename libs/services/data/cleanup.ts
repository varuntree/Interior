import type { SupabaseClient } from '@supabase/supabase-js'
import runtimeConfig from '@/libs/app-config/runtime'
import { logger } from '@/libs/observability/logger'

export interface CleanupResult {
  success: boolean
  itemsProcessed: number
  itemsRemoved: number
  errors: string[]
  details: CleanupDetail[]
}

export interface CleanupDetail {
  type: string
  id: string
  action: 'deleted' | 'updated' | 'skipped'
  reason: string
}

export interface CleanupStats {
  stuckJobs: CleanupResult
  orphanedRecords: CleanupResult
  expiredTokens: CleanupResult
  oldGenerationJobs: CleanupResult
}

export async function markStuckJobsAsFailed(
  supabase: SupabaseClient,
  timeoutMs = runtimeConfig.replicate.timeouts.overallMs
): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    itemsProcessed: 0,
    itemsRemoved: 0,
    errors: [],
    details: []
  }

  try {
    // Find jobs that are stuck (processing for too long)
    const cutoffTime = new Date(Date.now() - timeoutMs).toISOString()
    
    const { data: stuckJobs, error: queryError } = await supabase
      .from('generation_jobs')
      .select('id, owner_id, created_at, status, prediction_id')
      .in('status', ['starting', 'processing'])
      .lt('created_at', cutoffTime)

    if (queryError) {
      result.success = false
      result.errors.push(`Failed to query stuck jobs: ${queryError.message}`)
      return result
    }

    result.itemsProcessed = stuckJobs?.length || 0

    for (const job of stuckJobs || []) {
      try {
        // Mark job as failed
        const { error: updateError } = await supabase
          .from('generation_jobs')
          .update({
            status: 'failed',
            error: 'Job timed out and was automatically marked as failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id)

        if (updateError) {
          result.errors.push(`Failed to update job ${job.id}: ${updateError.message}`)
          result.details.push({
            type: 'stuck_job',
            id: job.id,
            action: 'skipped',
            reason: `Update failed: ${updateError.message}`
          })
        } else {
          result.itemsRemoved++
          result.details.push({
            type: 'stuck_job',
            id: job.id,
            action: 'updated',
            reason: `Marked as failed after ${Math.round((Date.now() - new Date(job.created_at).getTime()) / 1000 / 60)} minutes`
          })
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Exception processing job ${job.id}: ${errorMsg}`)
      }
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

export async function removeOrphanedRecords(
  supabase: SupabaseClient
): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    itemsProcessed: 0,
    itemsRemoved: 0,
    errors: [],
    details: []
  }

  try {
    // Remove orphaned collection items (referencing non-existent collections)
    const orphanedCollectionItems = await removeOrphanedCollectionItems(supabase)
    result.itemsProcessed += orphanedCollectionItems.itemsProcessed
    result.itemsRemoved += orphanedCollectionItems.itemsRemoved
    result.errors.push(...orphanedCollectionItems.errors)
    result.details.push(...orphanedCollectionItems.details)

    // Remove orphaned render variants (referencing non-existent renders)
    const orphanedVariants = await removeOrphanedRenderVariants(supabase)
    result.itemsProcessed += orphanedVariants.itemsProcessed
    result.itemsRemoved += orphanedVariants.itemsRemoved
    result.errors.push(...orphanedVariants.errors)
    result.details.push(...orphanedVariants.details)

    // Remove usage ledger entries for non-existent jobs
    const orphanedUsage = await removeOrphanedUsageEntries(supabase)
    result.itemsProcessed += orphanedUsage.itemsProcessed
    result.itemsRemoved += orphanedUsage.itemsRemoved
    result.errors.push(...orphanedUsage.errors)
    result.details.push(...orphanedUsage.details)

  } catch (error) {
    result.success = false
    result.errors.push(`Orphaned records cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  if (result.errors.length > 0) {
    result.success = false
  }

  return result
}

async function removeOrphanedCollectionItems(supabase: SupabaseClient): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    itemsProcessed: 0,
    itemsRemoved: 0,
    errors: [],
    details: []
  }

  // Find collection items referencing non-existent collections
  const { data: orphanedItems, error: queryError } = await supabase
    .from('collection_items')
    .select('collection_id, render_id')
    .not('collection_id', 'in',
      supabase.from('collections').select('id')
    )

  if (queryError) {
    result.errors.push(`Failed to query orphaned collection items: ${queryError.message}`)
    return result
  }

  result.itemsProcessed = orphanedItems?.length || 0

  for (const item of orphanedItems || []) {
    const { error: deleteError } = await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', item.collection_id)
      .eq('render_id', item.render_id)

    if (deleteError) {
      result.errors.push(`Failed to delete collection item: ${deleteError.message}`)
      result.details.push({
        type: 'orphaned_collection_item',
        id: `${item.collection_id}-${item.render_id}`,
        action: 'skipped',
        reason: `Delete failed: ${deleteError.message}`
      })
    } else {
      result.itemsRemoved++
      result.details.push({
        type: 'orphaned_collection_item',
        id: `${item.collection_id}-${item.render_id}`,
        action: 'deleted',
        reason: 'Referenced non-existent collection'
      })
    }
  }

  return result
}

async function removeOrphanedRenderVariants(supabase: SupabaseClient): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    itemsProcessed: 0,
    itemsRemoved: 0,
    errors: [],
    details: []
  }

  // Find render variants referencing non-existent renders
  const { data: orphanedVariants, error: queryError } = await supabase
    .from('render_variants')
    .select('id, render_id')
    .not('render_id', 'in',
      supabase.from('renders').select('id')
    )

  if (queryError) {
    result.errors.push(`Failed to query orphaned render variants: ${queryError.message}`)
    return result
  }

  result.itemsProcessed = orphanedVariants?.length || 0

  for (const variant of orphanedVariants || []) {
    const { error: deleteError } = await supabase
      .from('render_variants')
      .delete()
      .eq('id', variant.id)

    if (deleteError) {
      result.errors.push(`Failed to delete render variant ${variant.id}: ${deleteError.message}`)
      result.details.push({
        type: 'orphaned_render_variant',
        id: variant.id,
        action: 'skipped',
        reason: `Delete failed: ${deleteError.message}`
      })
    } else {
      result.itemsRemoved++
      result.details.push({
        type: 'orphaned_render_variant',
        id: variant.id,
        action: 'deleted',
        reason: `Referenced non-existent render ${variant.render_id}`
      })
    }
  }

  return result
}

async function removeOrphanedUsageEntries(supabase: SupabaseClient): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    itemsProcessed: 0,
    itemsRemoved: 0,
    errors: [],
    details: []
  }

  // Find usage entries referencing non-existent jobs
  const { data: orphanedUsage, error: queryError } = await supabase
    .from('usage_ledger')
    .select('id, meta')
    .eq('kind', 'generation_debit')
    .not('meta->jobId', 'is', null)

  if (queryError) {
    result.errors.push(`Failed to query orphaned usage entries: ${queryError.message}`)
    return result
  }

  for (const entry of orphanedUsage || []) {
    result.itemsProcessed++

    const jobId = entry.meta?.jobId
    if (!jobId) continue

    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .select('id')
      .eq('id', jobId)
      .maybeSingle()

    if (jobError) {
      result.errors.push(`Failed to check job ${jobId}: ${jobError.message}`)
      continue
    }

    if (!job) {
      // Job doesn't exist, remove usage entry
      const { error: deleteError } = await supabase
        .from('usage_ledger')
        .delete()
        .eq('id', entry.id)

      if (deleteError) {
        result.errors.push(`Failed to delete usage entry ${entry.id}: ${deleteError.message}`)
        result.details.push({
          type: 'orphaned_usage_entry',
          id: entry.id,
          action: 'skipped',
          reason: `Delete failed: ${deleteError.message}`
        })
      } else {
        result.itemsRemoved++
        result.details.push({
          type: 'orphaned_usage_entry',
          id: entry.id,
          action: 'deleted',
          reason: `Referenced non-existent job ${jobId}`
        })
      }
    }
  }

  return result
}

export async function cleanupExpiredTokens(
  supabase: SupabaseClient
): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    itemsProcessed: 0,
    itemsRemoved: 0,
    errors: [],
    details: []
  }

  // This is a placeholder for cleaning up expired signed URLs or tokens
  // In the current implementation, we don't store signed URLs in the database
  // But this could be used for future caching implementations

  try {
    // If you implement URL caching in the future, add cleanup logic here
    result.details.push({
      type: 'expired_tokens',
      id: 'system',
      action: 'skipped',
      reason: 'No token cleanup needed in current implementation'
    })
  } catch (error) {
    result.success = false
    result.errors.push(`Token cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

export async function archiveOldGenerationJobs(
  supabase: SupabaseClient,
  archiveAfterDays = 90
): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    itemsProcessed: 0,
    itemsRemoved: 0,
    errors: [],
    details: []
  }

  try {
    const cutoffDate = new Date(Date.now() - archiveAfterDays * 24 * 60 * 60 * 1000).toISOString()

    // Find old completed jobs
    const { data: oldJobs, error: queryError } = await supabase
      .from('generation_jobs')
      .select('id, owner_id, status, completed_at, error')
      .in('status', ['succeeded', 'failed', 'canceled'])
      .lt('completed_at', cutoffDate)

    if (queryError) {
      result.errors.push(`Failed to query old jobs: ${queryError.message}`)
      return result
    }

    result.itemsProcessed = oldJobs?.length || 0

    // For now, we'll just mark jobs as archived rather than delete them
    // In a full implementation, you might move them to an archive table
    for (const job of oldJobs || []) {
      try {
        // Add archive flag to metadata
        const { error: updateError } = await supabase
          .from('generation_jobs')
          .update({
            error: job.error ? `${job.error} [ARCHIVED]` : '[ARCHIVED]'
          })
          .eq('id', job.id)

        if (updateError) {
          result.errors.push(`Failed to archive job ${job.id}: ${updateError.message}`)
          result.details.push({
            type: 'old_generation_job',
            id: job.id,
            action: 'skipped',
            reason: `Archive failed: ${updateError.message}`
          })
        } else {
          result.itemsRemoved++
          result.details.push({
            type: 'old_generation_job',
            id: job.id,
            action: 'updated',
            reason: `Archived job older than ${archiveAfterDays} days`
          })
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Exception archiving job ${job.id}: ${errorMsg}`)
      }
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Archive cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

export async function performFullCleanup(
  supabase: SupabaseClient,
  options: {
    cleanStuckJobs?: boolean
    cleanOrphanedRecords?: boolean
    cleanExpiredTokens?: boolean
    archiveOldJobs?: boolean
    archiveAfterDays?: number
  } = {}
): Promise<CleanupStats> {
  const {
    cleanStuckJobs = true,
    cleanOrphanedRecords = true,
    cleanExpiredTokens = false,
    archiveOldJobs = false,
    archiveAfterDays = 90
  } = options

  const results: Partial<CleanupStats> = {}

  if (cleanStuckJobs) {
    results.stuckJobs = await markStuckJobsAsFailed(supabase)
  }

  if (cleanOrphanedRecords) {
    results.orphanedRecords = await removeOrphanedRecords(supabase)
  }

  if (cleanExpiredTokens) {
    results.expiredTokens = await cleanupExpiredTokens(supabase)
  }

  if (archiveOldJobs) {
    results.oldGenerationJobs = await archiveOldGenerationJobs(supabase, archiveAfterDays)
  }

  return results as CleanupStats
}

export function generateCleanupReport(stats: CleanupStats): string {
  let report = '# Cleanup Report\n\n'
  report += `Generated: ${new Date().toISOString()}\n\n`

  const sections = [
    { name: 'Stuck Jobs', result: stats.stuckJobs },
    { name: 'Orphaned Records', result: stats.orphanedRecords },
    { name: 'Expired Tokens', result: stats.expiredTokens },
    { name: 'Old Generation Jobs', result: stats.oldGenerationJobs }
  ].filter(section => section.result)

  let totalProcessed = 0
  let totalRemoved = 0
  let totalErrors = 0

  sections.forEach(section => {
    const result = section.result!
    report += `## ${section.name}\n`
    report += `- Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}\n`
    report += `- Processed: ${result.itemsProcessed}\n`
    report += `- Removed/Updated: ${result.itemsRemoved}\n`
    report += `- Errors: ${result.errors.length}\n\n`

    totalProcessed += result.itemsProcessed
    totalRemoved += result.itemsRemoved
    totalErrors += result.errors.length

    if (result.errors.length > 0) {
      report += '### Errors:\n'
      result.errors.forEach(error => {
        report += `- ❌ ${error}\n`
      })
      report += '\n'
    }

    if (result.details.length > 0) {
      report += '### Details:\n'
      result.details.forEach(detail => {
        const icon = detail.action === 'deleted' ? '🗑️' : detail.action === 'updated' ? '✏️' : '⏭️'
        report += `${icon} **${detail.type}** ${detail.id}: ${detail.reason}\n`
      })
      report += '\n'
    }
  })

  report += `## Summary\n`
  report += `- Total Processed: ${totalProcessed}\n`
  report += `- Total Cleaned: ${totalRemoved}\n`
  report += `- Total Errors: ${totalErrors}\n`
  report += `- Overall Status: ${totalErrors === 0 ? '✅ SUCCESS' : '❌ SOME FAILURES'}\n`

  return report
}

export function scheduleCleanup(
  supabase: SupabaseClient,
  intervalHours = 24
): NodeJS.Timeout {
  const intervalMs = intervalHours * 60 * 60 * 1000

  return setInterval(async () => {
    try {
      logger.info('cleanup.run_start')
      const stats = await performFullCleanup(supabase, {
        cleanStuckJobs: true,
        cleanOrphanedRecords: true,
        cleanExpiredTokens: false,
        archiveOldJobs: false
      })

      const report = generateCleanupReport(stats)
      logger.info('cleanup.run_completed', { report })
    } catch (error) {
      logger.error('cleanup.run_failed', { message: (error as any)?.message })
    }
  }, intervalMs)
}
