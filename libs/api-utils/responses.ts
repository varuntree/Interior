// libs/api-utils/responses.ts
import { NextResponse } from 'next/server'

export function ok<T>(data: T, message?: string) {
  return NextResponse.json({ success: true, data, message } as const, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

export function fail(status: number, code: string, message: string, details?: unknown) {
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