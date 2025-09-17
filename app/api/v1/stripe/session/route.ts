import { NextRequest } from 'next/server'
import { withMethods } from '@/libs/api-utils/methods'
import { ok, fail } from '@/libs/api-utils/responses'
import { withRequestContext } from '@/libs/observability/request'
import { createClient } from '@/libs/supabase/server'
import { getCheckoutSessionSummary, getUserBillingInfo } from '@/libs/services/billing'

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], withRequestContext(async (req: NextRequest) => {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return fail(400, 'VALIDATION_ERROR', 'Missing session_id')
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return fail(401, 'UNAUTHORIZED', 'Sign in required')
  }

  const summary = await getCheckoutSessionSummary(sessionId)
  if (!summary) {
    return fail(404, 'NOT_FOUND', 'Checkout session not found')
  }

  const billingInfo = await getUserBillingInfo({ supabase }, user.id)
  const customerMatches = summary.customerId && billingInfo.customerId && summary.customerId === billingInfo.customerId
  const emailMatches = summary.customerEmail && user.email && summary.customerEmail === user.email

  if (!customerMatches && !emailMatches) {
    return fail(403, 'FORBIDDEN', 'Session does not belong to current user')
  }

  return ok({
    amount: summary.amount,
    currency: summary.currency,
    planType: summary.planType,
    eventId: summary.eventId,
  })
}))
