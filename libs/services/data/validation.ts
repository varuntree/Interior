import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/libs/observability/logger'

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  summary: {
    totalChecked: number
    issuesFound: number
    criticalIssues: number
  }
}

export interface ValidationIssue {
  type: 'critical' | 'warning' | 'info'
  category: string
  description: string
  affectedId?: string
  suggestedAction?: string
}

export interface DataConsistencyReport {
  renderJobRelationships: ValidationResult
  collectionItemConsistency: ValidationResult
  storagePathValidation: ValidationResult
  usageLedgerAccuracy: ValidationResult
  defaultFavoritesIntegrity: ValidationResult
}

export async function validateRenderJobRelationships(
  supabase: SupabaseClient
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  let totalChecked = 0

  try {
    // Check for renders without corresponding jobs
    const { data: orphanedRenders, error: rendersError } = await supabase
      .from('renders')
      .select('id, job_id')
      .not('job_id', 'in', 
        supabase.from('generation_jobs').select('id')
      )

    if (rendersError) throw rendersError

    totalChecked += orphanedRenders?.length || 0

    orphanedRenders?.forEach(render => {
      issues.push({
        type: 'critical',
        category: 'render_job_relationship',
        description: `Render ${render.id} references non-existent job ${render.job_id}`,
        affectedId: render.id,
        suggestedAction: 'Delete orphaned render or restore missing job'
      })
    })

    // Check for jobs without renders (only for succeeded jobs older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: jobsWithoutRenders, error: jobsError } = await supabase
      .from('generation_jobs')
      .select('id, status, created_at')
      .eq('status', 'succeeded')
      .lt('created_at', oneHourAgo)
      .not('id', 'in',
        supabase.from('renders').select('job_id')
      )

    if (jobsError) throw jobsError

    totalChecked += jobsWithoutRenders?.length || 0

    jobsWithoutRenders?.forEach(job => {
      issues.push({
        type: 'warning',
        category: 'render_job_relationship',
        description: `Succeeded job ${job.id} has no corresponding render`,
        affectedId: job.id,
        suggestedAction: 'Investigate webhook processing or create render manually'
      })
    })

  } catch (error) {
    issues.push({
      type: 'critical',
      category: 'validation_error',
      description: `Failed to validate render-job relationships: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestedAction: 'Check database connectivity and permissions'
    })
  }

  return {
    valid: issues.filter(i => i.type === 'critical').length === 0,
    issues,
    summary: {
      totalChecked,
      issuesFound: issues.length,
      criticalIssues: issues.filter(i => i.type === 'critical').length
    }
  }
}

export async function validateCollectionItemConsistency(
  supabase: SupabaseClient
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  let totalChecked = 0

  try {
    // Check for collection items referencing non-existent collections
    const { data: orphanedItems, error: itemsError } = await supabase
      .from('collection_items')
      .select('collection_id, render_id')
      .not('collection_id', 'in',
        supabase.from('collections').select('id')
      )

    if (itemsError) throw itemsError

    totalChecked += orphanedItems?.length || 0

    orphanedItems?.forEach(item => {
      issues.push({
        type: 'critical',
        category: 'collection_consistency',
        description: `Collection item references non-existent collection ${item.collection_id}`,
        affectedId: item.collection_id,
        suggestedAction: 'Remove orphaned collection item'
      })
    })

    // Check for collection items referencing non-existent renders
    const { data: itemsWithoutRenders, error: renderItemsError } = await supabase
      .from('collection_items')
      .select('collection_id, render_id')
      .not('render_id', 'in',
        supabase.from('renders').select('id')
      )

    if (renderItemsError) throw renderItemsError

    totalChecked += itemsWithoutRenders?.length || 0

    itemsWithoutRenders?.forEach(item => {
      issues.push({
        type: 'warning',
        category: 'collection_consistency',
        description: `Collection item references non-existent render ${item.render_id}`,
        affectedId: item.render_id,
        suggestedAction: 'Remove orphaned collection item'
      })
    })

    // Check for users without default favorites collection
    const { data: usersWithoutFavorites, error: favoritesError } = await supabase
      .from('profiles')
      .select('id')
      .not('id', 'in',
        supabase.from('collections').select('owner_id').eq('is_default_favorites', true)
      )

    if (favoritesError) throw favoritesError

    totalChecked += usersWithoutFavorites?.length || 0

    usersWithoutFavorites?.forEach(user => {
      issues.push({
        type: 'warning',
        category: 'collection_consistency',
        description: `User ${user.id} is missing default favorites collection`,
        affectedId: user.id,
        suggestedAction: 'Create default favorites collection for user'
      })
    })

  } catch (error) {
    issues.push({
      type: 'critical',
      category: 'validation_error',
      description: `Failed to validate collection consistency: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestedAction: 'Check database connectivity and permissions'
    })
  }

  return {
    valid: issues.filter(i => i.type === 'critical').length === 0,
    issues,
    summary: {
      totalChecked,
      issuesFound: issues.length,
      criticalIssues: issues.filter(i => i.type === 'critical').length
    }
  }
}

export async function validateStoragePathReferences(
  supabase: SupabaseClient
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  let totalChecked = 0

  try {
    // Check generation jobs for invalid input paths
    const { data: jobs, error: jobsError } = await supabase
      .from('generation_jobs')
      .select('id, input1_path, input2_path')
      .or('input1_path.not.is.null,input2_path.not.is.null')

    if (jobsError) throw jobsError

    for (const job of jobs || []) {
      totalChecked++

      // Validate input1_path format
      if (job.input1_path && !isValidStoragePath(job.input1_path, 'input')) {
        issues.push({
          type: 'warning',
          category: 'storage_path_validation',
          description: `Job ${job.id} has invalid input1_path format: ${job.input1_path}`,
          affectedId: job.id,
          suggestedAction: 'Update path format or verify file exists'
        })
      }

      // Validate input2_path format
      if (job.input2_path && !isValidStoragePath(job.input2_path, 'input')) {
        issues.push({
          type: 'warning',
          category: 'storage_path_validation',
          description: `Job ${job.id} has invalid input2_path format: ${job.input2_path}`,
          affectedId: job.id,
          suggestedAction: 'Update path format or verify file exists'
        })
      }
    }

    // Check render variants for invalid image paths
    const { data: variants, error: variantsError } = await supabase
      .from('render_variants')
      .select('id, render_id, image_path, thumb_path')

    if (variantsError) throw variantsError

    for (const variant of variants || []) {
      totalChecked++

      // Validate image_path format
      if (!isValidStoragePath(variant.image_path, 'output')) {
        issues.push({
          type: 'warning',
          category: 'storage_path_validation',
          description: `Render variant ${variant.id} has invalid image_path format: ${variant.image_path}`,
          affectedId: variant.id,
          suggestedAction: 'Update path format or verify file exists'
        })
      }

      // Validate thumb_path format if present
      if (variant.thumb_path && !isValidStoragePath(variant.thumb_path, 'output')) {
        issues.push({
          type: 'info',
          category: 'storage_path_validation',
          description: `Render variant ${variant.id} has invalid thumb_path format: ${variant.thumb_path}`,
          affectedId: variant.id,
          suggestedAction: 'Update thumbnail path format'
        })
      }
    }

  } catch (error) {
    issues.push({
      type: 'critical',
      category: 'validation_error',
      description: `Failed to validate storage paths: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestedAction: 'Check database connectivity and permissions'
    })
  }

  return {
    valid: issues.filter(i => i.type === 'critical').length === 0,
    issues,
    summary: {
      totalChecked,
      issuesFound: issues.length,
      criticalIssues: issues.filter(i => i.type === 'critical').length
    }
  }
}

export async function validateUsageLedgerAccuracy(
  supabase: SupabaseClient
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  let totalChecked = 0

  try {
    // Check for usage entries referencing non-existent jobs
    const { data: orphanedUsage, error: usageError } = await supabase
      .from('usage_ledger')
      .select('id, meta')
      .eq('kind', 'generation_debit')
      .not('meta->jobId', 'is', null)

    if (usageError) throw usageError

    for (const entry of orphanedUsage || []) {
      totalChecked++

      const jobId = entry.meta?.jobId
      if (jobId) {
        // Check if job exists
        const { data: job, error: jobError } = await supabase
          .from('generation_jobs')
          .select('id')
          .eq('id', jobId)
          .maybeSingle()

        if (jobError) continue

        if (!job) {
          issues.push({
            type: 'warning',
            category: 'usage_ledger_accuracy',
            description: `Usage entry ${entry.id} references non-existent job ${jobId}`,
            affectedId: entry.id,
            suggestedAction: 'Update job reference or mark as orphaned'
          })
        }
      }
    }

    // Check for duplicate debits (same job, same user)
    const { data: duplicateDebits, error: duplicatesError } = await supabase.rpc(
      'find_duplicate_usage_debits'
    )

    if (duplicatesError && !duplicatesError.message.includes('does not exist')) {
      // Function might not exist, which is okay
      logger.warn('validation.usage_dedup_check_skipped')
    } else if (duplicateDebits) {
      duplicateDebits.forEach((dup: any) => {
        issues.push({
          type: 'warning',
          category: 'usage_ledger_accuracy',
          description: `Duplicate usage debits found for job ${dup.job_id} (${dup.count} entries)`,
          affectedId: dup.job_id,
          suggestedAction: 'Remove duplicate entries keeping the earliest'
        })
      })
    }

  } catch (error) {
    issues.push({
      type: 'critical',
      category: 'validation_error',
      description: `Failed to validate usage ledger: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestedAction: 'Check database connectivity and permissions'
    })
  }

  return {
    valid: issues.filter(i => i.type === 'critical').length === 0,
    issues,
    summary: {
      totalChecked,
      issuesFound: issues.length,
      criticalIssues: issues.filter(i => i.type === 'critical').length
    }
  }
}

export async function validateDefaultFavoritesIntegrity(
  supabase: SupabaseClient
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = []
  let totalChecked = 0

  try {
    // Check each user has exactly one default favorites collection
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')

    if (usersError) throw usersError

    for (const user of users || []) {
      totalChecked++

      const { data: defaultCollections, error: collectionsError } = await supabase
        .from('collections')
        .select('id, name')
        .eq('owner_id', user.id)
        .eq('is_default_favorites', true)

      if (collectionsError) continue

      if (!defaultCollections || defaultCollections.length === 0) {
        issues.push({
          type: 'warning',
          category: 'default_favorites_integrity',
          description: `User ${user.id} (${user.email}) has no default favorites collection`,
          affectedId: user.id,
          suggestedAction: 'Create default favorites collection'
        })
      } else if (defaultCollections.length > 1) {
        issues.push({
          type: 'critical',
          category: 'default_favorites_integrity',
          description: `User ${user.id} (${user.email}) has multiple default favorites collections`,
          affectedId: user.id,
          suggestedAction: 'Merge collections and keep only one as default'
        })
      }
    }

  } catch (error) {
    issues.push({
      type: 'critical',
      category: 'validation_error',
      description: `Failed to validate default favorites: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestedAction: 'Check database connectivity and permissions'
    })
  }

  return {
    valid: issues.filter(i => i.type === 'critical').length === 0,
    issues,
    summary: {
      totalChecked,
      issuesFound: issues.length,
      criticalIssues: issues.filter(i => i.type === 'critical').length
    }
  }
}

export async function performFullDataValidation(
  supabase: SupabaseClient
): Promise<DataConsistencyReport> {
  const [
    renderJobRelationships,
    collectionItemConsistency,
    storagePathValidation,
    usageLedgerAccuracy,
    defaultFavoritesIntegrity
  ] = await Promise.all([
    validateRenderJobRelationships(supabase),
    validateCollectionItemConsistency(supabase),
    validateStoragePathReferences(supabase),
    validateUsageLedgerAccuracy(supabase),
    validateDefaultFavoritesIntegrity(supabase)
  ])

  return {
    renderJobRelationships,
    collectionItemConsistency,
    storagePathValidation,
    usageLedgerAccuracy,
    defaultFavoritesIntegrity
  }
}

function isValidStoragePath(path: string, type: 'input' | 'output'): boolean {
  if (!path || typeof path !== 'string') return false

  if (type === 'input') {
    // Input paths should be: private/{userId}/inputs/{filename}
    return path.startsWith('private/') && path.includes('/inputs/')
  } else {
    // Output paths should be: renders/{renderId}/{filename} or public/renders/{renderId}/{filename}
    return (
      path.startsWith('renders/') || 
      path.startsWith('public/renders/')
    ) && path.split('/').length >= 3
  }
}

export function generateValidationReport(report: DataConsistencyReport): string {
  const sections = [
    { name: 'Render-Job Relationships', result: report.renderJobRelationships },
    { name: 'Collection Item Consistency', result: report.collectionItemConsistency },
    { name: 'Storage Path Validation', result: report.storagePathValidation },
    { name: 'Usage Ledger Accuracy', result: report.usageLedgerAccuracy },
    { name: 'Default Favorites Integrity', result: report.defaultFavoritesIntegrity }
  ]

  let reportText = '# Data Validation Report\n\n'
  reportText += `Generated: ${new Date().toISOString()}\n\n`

  let totalIssues = 0
  let criticalIssues = 0

  sections.forEach(section => {
    reportText += `## ${section.name}\n`
    reportText += `- Status: ${section.result.valid ? '✅ PASSED' : '❌ FAILED'}\n`
    reportText += `- Checked: ${section.result.summary.totalChecked} items\n`
    reportText += `- Issues: ${section.result.summary.issuesFound}\n`
    reportText += `- Critical: ${section.result.summary.criticalIssues}\n\n`

    totalIssues += section.result.summary.issuesFound
    criticalIssues += section.result.summary.criticalIssues

    if (section.result.issues.length > 0) {
      reportText += '### Issues Found:\n'
      section.result.issues.forEach(issue => {
        const icon = issue.type === 'critical' ? '🔴' : issue.type === 'warning' ? '🟡' : 'ℹ️'
        reportText += `${icon} **${issue.category}**: ${issue.description}\n`
        if (issue.suggestedAction) {
          reportText += `   💡 Suggested Action: ${issue.suggestedAction}\n`
        }
        reportText += '\n'
      })
    }
    reportText += '\n'
  })

  reportText += `## Summary\n`
  reportText += `- Total Issues: ${totalIssues}\n`
  reportText += `- Critical Issues: ${criticalIssues}\n`
  reportText += `- Overall Status: ${criticalIssues === 0 ? '✅ HEALTHY' : '❌ NEEDS ATTENTION'}\n`

  return reportText
}
