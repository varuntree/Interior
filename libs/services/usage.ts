import type { SupabaseClient } from '@supabase/supabase-js'
import * as usageRepo from '@/libs/repositories/usage'
import runtimeConfig from '@/libs/app-config/runtime'

export interface UserUsage {
  currentMonth: {
    debits: number
    credits: number
    net: number
  }
  remaining: number
  monthlyLimit: number
  planId: string
  planLabel: string
  billingPeriod: {
    start: string
    end: string
  }
}

export interface UsageHistoryItem {
  id: string
  kind: 'generation_debit' | 'credit_adjustment'
  amount: number
  created_at: string
  description: string
  jobId?: string
}

export async function getUserUsageStatus(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  userPriceId?: string
): Promise<UserUsage> {
  // Get user's plan information
  const planInfo = getPlanFromPriceId(userPriceId)
  
  // Get current month usage
  const currentMonthUsage = await usageRepo.getCurrentMonthUsage(ctx.supabase, ownerId)
  
  // Calculate remaining generations
  const remaining = await usageRepo.getRemainingGenerations(
    ctx.supabase,
    ownerId,
    planInfo.monthlyGenerations
  )

  // Calculate billing period (current month)
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    currentMonth: currentMonthUsage,
    remaining,
    monthlyLimit: planInfo.monthlyGenerations,
    planId: planInfo.id,
    planLabel: planInfo.label,
    billingPeriod: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString()
    }
  }
}

export async function checkGenerationAllowance(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  userPriceId?: string,
  requestedGenerations = 1
): Promise<{
  allowed: boolean
  remaining: number
  message?: string
}> {
  const planInfo = getPlanFromPriceId(userPriceId)
  
  const remaining = await usageRepo.getRemainingGenerations(
    ctx.supabase,
    ownerId,
    planInfo.monthlyGenerations
  )

  if (remaining >= requestedGenerations) {
    return {
      allowed: true,
      remaining
    }
  }

  return {
    allowed: false,
    remaining,
    message: `You've reached your monthly limit for the ${planInfo.label} plan. You have ${remaining} generations remaining.`
  }
}

export async function debitUserGeneration(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  jobId: string,
  idempotencyKey?: string
): Promise<void> {
  await usageRepo.debitGeneration(ctx.supabase, {
    ownerId,
    jobId,
    amount: 1,
    idempotencyKey
  })
}

export async function creditUserGeneration(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  amount: number,
  reason: string,
  relatedJobId?: string
): Promise<void> {
  await usageRepo.creditAdjustment(ctx.supabase, {
    ownerId,
    amount,
    reason,
    relatedJobId
  })
}

export async function getUserUsageHistory(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  options?: {
    limit?: number
    offset?: number
    fromDate?: string
    toDate?: string
  }
): Promise<UsageHistoryItem[]> {
  const entries = await usageRepo.listUsageHistory(ctx.supabase, ownerId, options)

  return entries.map(entry => ({
    id: entry.id,
    kind: entry.kind,
    amount: entry.amount,
    created_at: entry.created_at,
    description: formatUsageDescription(entry),
    jobId: entry.meta?.jobId
  }))
}

export async function getMonthlyUsageBreakdown(
  ctx: { supabase: SupabaseClient },
  ownerId: string,
  year: number,
  month: number
): Promise<{
  usage: { debits: number; credits: number; net: number }
  details: UsageHistoryItem[]
}> {
  // Get month's usage summary
  const usage = await usageRepo.getMonthlyUsage(ctx.supabase, ownerId, year, month)
  
  // Get detailed history for the month
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 1).toISOString()
  
  const details = await getUserUsageHistory(ctx, ownerId, {
    fromDate: startDate,
    toDate: endDate,
    limit: 100
  })

  return {
    usage,
    details
  }
}

export async function getUserUsageStats(
  ctx: { supabase: SupabaseClient },
  ownerId: string
): Promise<{
  totalGenerations: number
  totalCredits: number
  averagePerMonth: number
  mostActiveMonth: string
}> {
  // Get all usage history
  const allHistory = await usageRepo.listUsageHistory(ctx.supabase, ownerId, {
    limit: 1000
  })

  let totalGenerations = 0
  let totalCredits = 0
  const monthlyBreakdown: Record<string, number> = {}

  allHistory.forEach(entry => {
    const monthKey = entry.created_at.substring(0, 7) // YYYY-MM format
    
    if (entry.kind === 'generation_debit') {
      totalGenerations += entry.amount
      monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + entry.amount
    } else if (entry.kind === 'credit_adjustment') {
      totalCredits += entry.amount
    }
  })

  // Calculate average per month
  const monthsWithActivity = Object.keys(monthlyBreakdown).length
  const averagePerMonth = monthsWithActivity > 0 ? totalGenerations / monthsWithActivity : 0

  // Find most active month
  const mostActiveMonth = Object.entries(monthlyBreakdown)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || new Date().toISOString().substring(0, 7)

  return {
    totalGenerations,
    totalCredits,
    averagePerMonth: Math.round(averagePerMonth * 100) / 100,
    mostActiveMonth
  }
}

export function getPlanFromPriceId(priceId?: string): {
  id: string
  label: string
  monthlyGenerations: number
  maxConcurrentJobs: number
} {
  if (!priceId || !runtimeConfig.plans[priceId]) {
    // Return default/free plan
    return {
      id: 'free',
      label: 'Free',
      monthlyGenerations: 20,
      maxConcurrentJobs: 1
    }
  }

  const plan = runtimeConfig.plans[priceId]
  return {
    id: priceId,
    label: plan.label,
    monthlyGenerations: plan.monthlyGenerations,
    maxConcurrentJobs: plan.maxConcurrentJobs || 1
  }
}

export function formatUsageDescription(entry: any): string {
  if (entry.kind === 'generation_debit') {
    if (entry.meta?.jobId) {
      return `Generated image (Job: ${entry.meta.jobId.substring(0, 8)}...)`
    }
    return 'Generated image'
  }
  
  if (entry.kind === 'credit_adjustment') {
    if (entry.meta?.reason) {
      return `Credit: ${entry.meta.reason}`
    }
    return 'Credit adjustment'
  }
  
  return 'Usage entry'
}

export function canUserGenerate(
  remainingGenerations: number,
  requestedGenerations = 1
): boolean {
  return remainingGenerations >= requestedGenerations
}

export function getUpgradeMessage(planLabel: string): string {
  return `You've reached your monthly limit for the ${planLabel} plan. Upgrade to generate more images!`
}

export function getRemainingMessage(remaining: number, planLabel: string): string {
  if (remaining === 0) {
    return getUpgradeMessage(planLabel)
  }
  
  if (remaining === 1) {
    return `You have 1 generation remaining this month on the ${planLabel} plan.`
  }
  
  return `You have ${remaining} generations remaining this month on the ${planLabel} plan.`
}

// Helper to check if user is close to their limit (within 20%)
export function isNearLimit(remaining: number, monthlyLimit: number): boolean {
  const used = monthlyLimit - remaining
  const usagePercentage = used / monthlyLimit
  return usagePercentage >= 0.8 // 80% used
}

// Helper to get next billing cycle reset date
export function getNextResetDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1)
}

// Helper to format dates for UI
export function formatBillingPeriod(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const formatter = new Intl.DateTimeFormat('en-AU', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
}