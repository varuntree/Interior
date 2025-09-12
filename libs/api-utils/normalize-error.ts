import { ERROR_CODES, getErrorInfo } from './error-codes'

export type NormalizedError = {
  status: number
  code: string
  message: string
}

export function normalizeError(err: unknown, fallback: NormalizedError = {
  status: 500,
  code: ERROR_CODES.INTERNAL_ERROR,
  message: 'Internal server error'
}): NormalizedError {
  if (!err) return fallback

  // If route threw a structured error
  if (typeof err === 'object' && err !== null) {
    const anyErr: any = err
    const code: string | undefined = anyErr.code || anyErr.error?.code
    const message: string | undefined = anyErr.message || anyErr.error?.message
    const status: number | undefined = anyErr.status || anyErr.httpStatus

    if (code && typeof code === 'string') {
      const info = getErrorInfo(code as any)
      return {
        status: status ?? info.httpStatus,
        code,
        message: message ?? info.message,
      }
    }

    if (typeof message === 'string') {
      return {
        status: status ?? 500,
        code: ERROR_CODES.INTERNAL_ERROR,
        message,
      }
    }
  }

  return fallback
}

