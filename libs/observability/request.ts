import { NextRequest } from 'next/server'
import { createLogger, Logger } from '@/libs/observability/logger'

type AnyCtx = Record<string, unknown> | undefined
type Handler = (req: NextRequest, ctx?: AnyCtx & { logger: Logger; requestId: string }) => Promise<Response>

function genRequestId(): string {
  try {
    // crypto.randomUUID in Node >= 16
    // @ts-ignore
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function withRequestContext(handler: Handler): any {
  return async (req: NextRequest, nextCtx?: AnyCtx) => {
    const requestId = genRequestId()
    const url = new URL(req.url)
    const route = url.pathname
    const method = req.method

    const baseLogger = createLogger({ requestId, route, method })
    baseLogger.info('http.request.start')
    const start = Date.now()
    try {
      const res = await handler(req, { ...(nextCtx || {}), logger: baseLogger, requestId })
      const headers = new Headers(res.headers)
      headers.set('x-request-id', requestId)
      const durationMs = Date.now() - start
      baseLogger.info('http.request.end', { status: res.status, durationMs })
      return new Response(res.body, { status: res.status, headers })
    } catch (err: any) {
      const durationMs = Date.now() - start
      baseLogger.error('http.request.error', { message: err?.message || String(err) })
      baseLogger.info('http.request.end', { status: 500, durationMs })
      // Re-throw; route catch blocks should transform to fail()
      throw err
    }
  }
}
