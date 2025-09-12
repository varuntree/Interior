import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'

export type RequestHandler = (req: NextRequest) => Promise<Response>

export function withRequestId(handler: RequestHandler): RequestHandler {
  return async (req: NextRequest) => {
    const requestId = safeId()
    const res = await handler(req)
    const headers = new Headers(res.headers)
    headers.set('x-request-id', requestId)
    return new Response(res.body, { status: res.status, headers })
  }
}

function safeId(): string {
  try {
    return randomUUID()
  } catch {
    // Fallback if crypto not available
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  }
}

