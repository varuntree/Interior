// app/api/v1/usage/route.ts
import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/methods'
import { withRequestId } from '@/libs/api-utils/with-request'
import { ok, fail } from '@/libs/api-utils/responses'
import { CACHE_CONFIGS } from '@/libs/api-utils/cache'
import { createServiceSupabaseClient } from '@/libs/api-utils/supabase'
import { createClient } from '@/libs/supabase/server'
import { getUserUsageStatus, getUserUsageHistory } from '@/libs/services/usage'
import { getUserBillingInfo } from '@/libs/services/billing'
import { getProfile } from '@/libs/services/profile'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], withRequestId(async (req: NextRequest) => {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required')
    }

    // Parse query parameters
    const url = new URL(req.url)
    const includeHistory = url.searchParams.get('includeHistory') === 'true'
    const historyLimit = parseInt(url.searchParams.get('historyLimit') || '10')

    // Get service client
    const serviceSupabase = createServiceSupabaseClient()

    // Get user profile to determine plan
    const profile = await getProfile({ supabase: serviceSupabase }, user.id)
    if (!profile) {
      return fail(404, 'NOT_FOUND', 'User profile not found')
    }

    // Get usage status
    const usageStatus = await getUserUsageStatus(
      { supabase: serviceSupabase },
      user.id,
      profile.price_id
    )

    // Get billing info
    const billingInfo = await getUserBillingInfo(
      { supabase: serviceSupabase },
      user.id
    )

    // Build base response
    let response: any = {
      usage: {
        currentMonth: {
          used: usageStatus.currentMonth.net,
          debits: usageStatus.currentMonth.debits,
          credits: usageStatus.currentMonth.credits
        },
        remaining: usageStatus.remaining,
        monthlyLimit: usageStatus.monthlyLimit,
        percentage: usageStatus.monthlyLimit > 0 
          ? Math.round((usageStatus.currentMonth.net / usageStatus.monthlyLimit) * 100)
          : 0
      },
      plan: {
        id: billingInfo.plan.id,
        label: billingInfo.plan.label,
        pricePerMonth: billingInfo.plan.priceAudPerMonth,
        monthlyGenerations: billingInfo.plan.monthlyGenerations,
        maxConcurrentJobs: billingInfo.plan.maxConcurrentJobs,
        features: billingInfo.plan.features
      },
      billingPeriod: {
        start: usageStatus.billingPeriod.start,
        end: usageStatus.billingPeriod.end,
        daysRemaining: Math.ceil(
          (new Date(usageStatus.billingPeriod.end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      },
      billing: {
        customerId: billingInfo.customerId,
        hasAccess: billingInfo.hasAccess,
        subscriptionStatus: billingInfo.subscriptionStatus
      }
    }

    // Include usage history if requested
    if (includeHistory) {
      const history = await getUserUsageHistory(
        { supabase: serviceSupabase },
        user.id,
        { limit: historyLimit }
      )

      response.history = history.map(entry => ({
        id: entry.id,
        type: entry.kind,
        amount: entry.amount,
        description: entry.description,
        createdAt: entry.created_at,
        jobId: entry.jobId
      }))
    }

    // Add helpful computed fields
    response.computed = {
      isNearLimit: usageStatus.remaining <= 3,
      canGenerate: usageStatus.remaining > 0,
      daysUntilReset: Math.ceil(
        (new Date(usageStatus.billingPeriod.end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      averagePerDay: usageStatus.monthlyLimit > 0 
        ? Math.round(usageStatus.currentMonth.net / (30 - Math.ceil(
            (new Date(usageStatus.billingPeriod.end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )))
        : 0
    }

    return ok(response, undefined, CACHE_CONFIGS.AUTH)

  } catch (error: any) {
    console.error('Usage status error:', error)
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch usage information')
  }
}))
