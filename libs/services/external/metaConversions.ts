import crypto from 'crypto'
import { env } from '@/libs/env'
import { logger } from '@/libs/observability/logger'

export interface MetaPurchaseEvent {
  eventId: string
  value: number
  currency: string
  orderId?: string
  planType?: string
  eventSourceUrl: string
  eventTime?: number
  userData: {
    email?: string
    fbp?: string
    fbc?: string
    clientUserAgent?: string
    clientIpAddress?: string
  }
}

function sha256(value?: string) {
  if (!value) return undefined
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export async function sendMetaPurchase(event: MetaPurchaseEvent): Promise<void> {
  const pixelId = env.server.FB_PIXEL_ID || env.public.NEXT_PUBLIC_FB_PIXEL_ID
  const token = env.server.META_CAPI_ACCESS_TOKEN

  if (!pixelId || !token) {
    logger.info('meta.disabled', { reason: 'missing_pixel_or_token' })
    return
  }

  const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${token}`
  const userData: Record<string, string> = {}
  const { email, fbp, fbc, clientIpAddress, clientUserAgent } = event.userData

  const hashedEmail = sha256(email)
  if (hashedEmail) userData.em = hashedEmail
  if (fbp) userData.fbp = fbp
  if (fbc) userData.fbc = fbc
  if (clientIpAddress) userData.client_ip_address = clientIpAddress
  if (clientUserAgent) userData.client_user_agent = clientUserAgent

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: 'Purchase',
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        user_data: userData,
        custom_data: {
          value: event.value,
          currency: (event.currency || 'AUD').toUpperCase(),
          order_id: event.orderId,
          plan_type: event.planType,
        },
      },
    ],
  }

  if (env.server.META_TEST_EVENT_CODE) {
    body.test_event_code = env.server.META_TEST_EVENT_CODE
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('meta.purchase.failed', { status: response.status, body: errorText })
    } else {
      logger.info('meta.purchase.sent', { eventId: event.eventId })
    }
  } catch (err: any) {
    logger.error('meta.purchase.error', { message: err?.message || String(err) })
  }
}
