import { NextRequest, NextResponse } from 'next/server'
import { withMethods } from '@/libs/api-utils/methods'
import { withRequestContext } from '@/libs/observability/request'
import { createClient } from '@/libs/supabase/server'
import { getApplicationUrl } from '@/libs/api-utils/url-validation'
import config from '@/config'
import runtimeConfig from '@/libs/app-config/runtime'
import { startCheckoutService } from '@/libs/services/billing'

function isValidRelativePath(next: string | null): next is string {
  if (!next) return false
  if (!next.startsWith('/')) return false
  // prevent protocol-relative and double slash open redirects
  if (next.startsWith('//')) return false
  return true
}

function isKnownPriceId(priceId: string | null): priceId is string {
  if (!priceId) return false
  const inConfig = config.stripe.plans.some(p => p.priceId === priceId)
  const inRuntime = !!runtimeConfig.plans[priceId as keyof typeof runtimeConfig.plans]
  return inConfig && inRuntime
}

export const dynamic = 'force-dynamic'

export const GET = withMethods(['GET'], withRequestContext(async (req: NextRequest, ctx?: { logger?: any }) => {
  const url = new URL(req.url)
  const priceId = url.searchParams.get('priceId')
  const baseUrl = getApplicationUrl(req)

  if (!isKnownPriceId(priceId)) {
    ctx?.logger?.warn?.('billing.checkout.invalid_price', { priceId })
    return NextResponse.redirect(`${baseUrl}/pricing`)
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const selfPath = `/start-checkout?priceId=${encodeURIComponent(priceId)}`

  if (!user) {
    // Not signed in: send to signin with ?next=/start-checkout?priceId=...
    const signinUrl = `${baseUrl}${config.auth.loginUrl}?next=${encodeURIComponent(selfPath)}`
    ctx?.logger?.info?.('billing.checkout.intent', { priceId })
    return NextResponse.redirect(signinUrl)
  }

  // Signed in: create Stripe checkout and redirect
  try {
    const result = await startCheckoutService(supabase, {
      userId: user.id,
      priceId: priceId,
      mode: 'subscription',
      successUrl: `${baseUrl}/dashboard/settings?success=true`,
      cancelUrl: `${baseUrl}/#pricing`,
    })
    ctx?.logger?.info?.('billing.checkout.redirect', { userId: user.id, priceId })
    return NextResponse.redirect(result.url)
  } catch (e: any) {
    ctx?.logger?.error?.('billing.checkout.intent_error', { message: e?.message, priceId })
    return NextResponse.redirect(`${baseUrl}/pricing`)
  }
}))

