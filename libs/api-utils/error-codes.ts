// libs/api-utils/error-codes.ts

export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // Resource Management
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',

  // Generation Specific
  TOO_MANY_INFLIGHT: 'TOO_MANY_INFLIGHT',
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  INVALID_MODE: 'INVALID_MODE',
  MISSING_INPUT_IMAGE: 'MISSING_INPUT_IMAGE',

  // Collections
  COLLECTION_NOT_FOUND: 'COLLECTION_NOT_FOUND',
  CANNOT_DELETE_FAVORITES: 'CANNOT_DELETE_FAVORITES',
  CANNOT_RENAME_FAVORITES: 'CANNOT_RENAME_FAVORITES',
  COLLECTION_NAME_INVALID: 'COLLECTION_NAME_INVALID',

  // Billing & Usage
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',
  BILLING_ERROR: 'BILLING_ERROR',

  // Rate Limiting
  RATE_LIMITED: 'RATE_LIMITED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Webhook Specific
  WEBHOOK_SIGNATURE_INVALID: 'WEBHOOK_SIGNATURE_INVALID',
  WEBHOOK_PAYLOAD_INVALID: 'WEBHOOK_PAYLOAD_INVALID',

  // Method Errors
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  UNSUPPORTED_OPERATION: 'UNSUPPORTED_OPERATION'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

export interface ErrorMap {
  code: ErrorCode
  httpStatus: number
  message: string
  retryable?: boolean
}

export const ERROR_MAP: Record<ErrorCode, Omit<ErrorMap, 'code'>> = {
  // Authentication & Authorization (4xx)
  [ERROR_CODES.UNAUTHORIZED]: {
    httpStatus: 401,
    message: 'Authentication required'
  },
  [ERROR_CODES.FORBIDDEN]: {
    httpStatus: 403,
    message: 'Access denied'
  },
  [ERROR_CODES.TOKEN_EXPIRED]: {
    httpStatus: 401,
    message: 'Authentication token has expired'
  },
  [ERROR_CODES.INVALID_TOKEN]: {
    httpStatus: 401,
    message: 'Invalid authentication token'
  },

  // Validation (4xx)
  [ERROR_CODES.VALIDATION_ERROR]: {
    httpStatus: 400,
    message: 'Validation failed'
  },
  [ERROR_CODES.INVALID_INPUT]: {
    httpStatus: 400,
    message: 'Invalid input provided'
  },
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: {
    httpStatus: 400,
    message: 'Required field is missing'
  },
  [ERROR_CODES.INVALID_FORMAT]: {
    httpStatus: 400,
    message: 'Invalid format'
  },
  [ERROR_CODES.INVALID_FILE_TYPE]: {
    httpStatus: 400,
    message: 'Unsupported file type'
  },
  [ERROR_CODES.FILE_TOO_LARGE]: {
    httpStatus: 413,
    message: 'File size exceeds maximum limit'
  },

  // Resource Management (4xx)
  [ERROR_CODES.NOT_FOUND]: {
    httpStatus: 404,
    message: 'Resource not found'
  },
  [ERROR_CODES.ALREADY_EXISTS]: {
    httpStatus: 409,
    message: 'Resource already exists'
  },
  [ERROR_CODES.RESOURCE_CONFLICT]: {
    httpStatus: 409,
    message: 'Resource conflict'
  },
  [ERROR_CODES.RESOURCE_LOCKED]: {
    httpStatus: 423,
    message: 'Resource is locked'
  },

  // Generation Specific (4xx)
  [ERROR_CODES.TOO_MANY_INFLIGHT]: {
    httpStatus: 409,
    message: 'Too many concurrent generations. Please wait for completion.'
  },
  [ERROR_CODES.LIMIT_EXCEEDED]: {
    httpStatus: 402,
    message: 'Generation limit exceeded'
  },
  [ERROR_CODES.GENERATION_FAILED]: {
    httpStatus: 422,
    message: 'Generation failed'
  },
  [ERROR_CODES.INVALID_MODE]: {
    httpStatus: 400,
    message: 'Invalid generation mode'
  },
  [ERROR_CODES.MISSING_INPUT_IMAGE]: {
    httpStatus: 400,
    message: 'Input image is required for this mode'
  },

  // Collections (4xx)
  [ERROR_CODES.COLLECTION_NOT_FOUND]: {
    httpStatus: 404,
    message: 'Collection not found'
  },
  [ERROR_CODES.CANNOT_DELETE_FAVORITES]: {
    httpStatus: 400,
    message: 'Cannot delete default favorites collection'
  },
  [ERROR_CODES.CANNOT_RENAME_FAVORITES]: {
    httpStatus: 400,
    message: 'Cannot rename default favorites collection'
  },
  [ERROR_CODES.COLLECTION_NAME_INVALID]: {
    httpStatus: 400,
    message: 'Invalid collection name'
  },

  // Billing & Usage (4xx)
  [ERROR_CODES.PAYMENT_REQUIRED]: {
    httpStatus: 402,
    message: 'Payment required'
  },
  [ERROR_CODES.QUOTA_EXCEEDED]: {
    httpStatus: 402,
    message: 'Usage quota exceeded'
  },
  [ERROR_CODES.SUBSCRIPTION_INACTIVE]: {
    httpStatus: 402,
    message: 'Subscription is inactive'
  },
  [ERROR_CODES.BILLING_ERROR]: {
    httpStatus: 402,
    message: 'Billing error occurred'
  },

  // Rate Limiting (4xx)
  [ERROR_CODES.RATE_LIMITED]: {
    httpStatus: 429,
    message: 'Rate limit exceeded'
  },
  [ERROR_CODES.TOO_MANY_REQUESTS]: {
    httpStatus: 429,
    message: 'Too many requests'
  },

  // Server Errors (5xx)
  [ERROR_CODES.INTERNAL_ERROR]: {
    httpStatus: 500,
    message: 'Internal server error',
    retryable: true
  },
  [ERROR_CODES.SERVICE_UNAVAILABLE]: {
    httpStatus: 503,
    message: 'Service temporarily unavailable',
    retryable: true
  },
  [ERROR_CODES.DATABASE_ERROR]: {
    httpStatus: 503,
    message: 'Database error',
    retryable: true
  },
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: {
    httpStatus: 502,
    message: 'External service error',
    retryable: true
  },

  // Webhook Specific (4xx)
  [ERROR_CODES.WEBHOOK_SIGNATURE_INVALID]: {
    httpStatus: 401,
    message: 'Invalid webhook signature'
  },
  [ERROR_CODES.WEBHOOK_PAYLOAD_INVALID]: {
    httpStatus: 400,
    message: 'Invalid webhook payload'
  },

  // Method Errors (4xx)
  [ERROR_CODES.METHOD_NOT_ALLOWED]: {
    httpStatus: 405,
    message: 'HTTP method not allowed'
  },
  [ERROR_CODES.UNSUPPORTED_OPERATION]: {
    httpStatus: 400,
    message: 'Unsupported operation'
  }
}

export function getErrorInfo(code: ErrorCode): ErrorMap {
  const info = ERROR_MAP[code]
  if (!info) {
    return {
      code: ERROR_CODES.INTERNAL_ERROR,
      httpStatus: 500,
      message: 'Unknown error'
    }
  }
  
  return { code, ...info }
}

export function createErrorResponse(
  code: ErrorCode,
  customMessage?: string,
  details?: unknown
): {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: unknown
  }
} {
  const errorInfo = getErrorInfo(code)
  
  return {
    success: false,
    error: {
      code,
      message: customMessage || errorInfo.message,
      ...(details && { details })
    }
  }
}