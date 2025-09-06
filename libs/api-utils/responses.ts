// libs/api-utils/responses.ts
import { NextResponse } from 'next/server'
import { type CacheConfig, buildCacheHeaders } from './cache'

// Flexible ok: supports (data, message?), (data, cacheConfig?), or (data, initLike)
export function ok<T>(
  data: T,
  messageOrInit?: string | ResponseInit | CacheConfig,
  cache?: CacheConfig
) {
  let message: string | undefined
  let headers: Record<string, string> = {}

  // Determine headers from cache config or init
  if (typeof messageOrInit === 'string' || typeof messageOrInit === 'undefined') {
    message = messageOrInit as string | undefined
    const cacheHeaders = cache ? buildCacheHeaders(cache) : { 'Cache-Control': 'private, no-store' }
    headers = { ...cacheHeaders }
  } else {
    // Treat second arg as ResponseInit or CacheConfig-like
    const possibleInit = messageOrInit as ResponseInit
    const cacheHeaders = { 'Cache-Control': 'private, no-store' }
    headers = { ...cacheHeaders, ...(possibleInit.headers as any) }
  }

  return NextResponse.json({ success: true, data, message } as const, { headers })
}

// Flexible fail: supports (status, code, message, details?) or (code, message, status, details?)
export function fail(
  a: number | string,
  b: string,
  c?: string | number,
  d?: unknown
) {
  let status: number
  let code: string
  let message: string
  let details: unknown = d

  if (typeof a === 'number') {
    status = a
    code = b
    message = (c as string) ?? ''
  } else {
    // a is code, b is message, c is status
    code = a
    message = b
    status = typeof c === 'number' ? c : 500
  }

  return NextResponse.json(
    { success: false, error: { code, message, details } } as const,
    { status, headers: { 'Cache-Control': 'private, no-store' } }
  )
}

// Backward compatibility functions for existing routes
export function created<T>(data: T, init: ResponseInit = {}) {
  return Response.json({ success: true, data }, { status: 201, ...init });
}

export function badRequest(message = "Invalid request") {
  return Response.json({ success: false, error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return Response.json({ success: false, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return Response.json({ success: false, error: message }, { status: 403 });
}

export function serverError(message = "Internal Server Error") {
  return Response.json({ success: false, error: message }, { status: 500 });
}
