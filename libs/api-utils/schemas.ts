// libs/api-utils/schemas.ts
import { z } from 'zod'

// Common validation patterns
export const uuidSchema = z.string().uuid('Invalid UUID format')
export const nonEmptyStringSchema = z.string().min(1, 'Cannot be empty').trim()
export const emailSchema = z.string().email('Invalid email format')

// Pagination schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(24),
  cursor: z.string().optional(),
  offset: z.coerce.number().min(0).default(0)
})

export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(50).default(20)
})

// Generation schemas
export const generationModeSchema = z.enum(['redesign', 'staging', 'compose', 'imagine'])
export const aspectRatioSchema = z.enum(['1:1', '3:2', '2:3'])
export const qualitySchema = z.enum(['auto', 'low', 'medium', 'high'])
export const variantsSchema = z.number().min(1).max(3)

export const generationRequestSchema = z.object({
  mode: generationModeSchema,
  prompt: z.string().max(500).optional(),
  roomType: z.string().max(100).optional(),
  style: z.string().max(100).optional(),
  aspectRatio: aspectRatioSchema.optional(),
  quality: qualitySchema.optional(),
  variants: variantsSchema.optional(),
  idempotencyKey: uuidSchema.optional(),
  input1Url: z.string().url().optional(),
  input2Url: z.string().url().optional()
})

export const generationFormDataSchema = z.object({
  mode: z.string(),
  prompt: z.string().optional(),
  roomType: z.string().optional(),
  style: z.string().optional(),
  aspectRatio: z.string().optional(),
  quality: z.string().optional(),
  variants: z.number().optional(),
  idempotencyKey: z.string().optional()
}).transform((data) => ({
  ...data,
  mode: data.mode as 'redesign' | 'staging' | 'compose' | 'imagine',
  aspectRatio: data.aspectRatio as '1:1' | '3:2' | '2:3' | undefined,
  quality: data.quality as 'auto' | 'low' | 'medium' | 'high' | undefined,
}))

// Collection schemas
export const collectionNameSchema = z.string().min(1).max(100).trim()

export const createCollectionSchema = z.object({
  name: collectionNameSchema
})

export const renameCollectionSchema = z.object({
  name: collectionNameSchema
})

export const addToCollectionSchema = z.object({
  renderId: uuidSchema
})

export const batchAddToCollectionSchema = z.object({
  renderIds: z.array(uuidSchema).min(1).max(50)
})

// Render schemas
export const renderFiltersSchema = z.object({
  mode: generationModeSchema.optional(),
  roomType: z.string().optional(),
  style: z.string().optional(),
  search: z.string().optional()
})

export const renderUpdateSchema = z.object({
  coverVariant: z.number().min(0).max(2).optional()
})

// Community schemas
export const communityQuerySchema = z.object({
  featured: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  itemsPerCollection: z.coerce.number().min(1).max(20).default(10),
  search: z.string().min(1).max(100).optional()
})

// Usage schemas
export const usageQuerySchema = z.object({
  includeHistory: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
  historyLimit: z.coerce.number().min(1).max(100).default(10)
})

// File validation schemas
export const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
export const maxFileSize = 15 * 1024 * 1024 // 15MB

export const fileValidationSchema = z.object({
  size: z.number().max(maxFileSize, 'File size too large'),
  type: z.enum(allowedImageTypes as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' })
  })
})

// Webhook schemas
export const replicateWebhookSchema = z.object({
  id: z.string(),
  status: z.enum(['starting', 'processing', 'succeeded', 'failed', 'canceled']),
  output: z.array(z.string().url()).nullable().optional(),
  error: z.string().nullable().optional(),
  logs: z.string().optional(),
  created_at: z.string(),
  started_at: z.string().optional(),
  completed_at: z.string().optional()
})

// API query parameter parsing helpers
export function parseQueryParams<T extends z.ZodType>(
  url: URL,
  schema: T
): z.infer<T> {
  const params: Record<string, string | string[]> = {}
  
  // Convert URLSearchParams to array to avoid iteration issues
  const searchParams = Array.from(url.searchParams.entries())
  
  for (const [key, value] of searchParams) {
    if (params[key]) {
      // Handle multiple values for the same key
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value)
      } else {
        params[key] = [params[key] as string, value]
      }
    } else {
      params[key] = value
    }
  }
  
  return schema.parse(params)
}

// Form data parsing helpers
export function parseFormDataField(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return value ? String(value) : undefined
}

export function parseFormDataNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key)
  return value ? parseInt(String(value), 10) : undefined
}

export function parseFormDataFile(formData: FormData, key: string): File | undefined {
  const value = formData.get(key)
  return value instanceof File ? value : undefined
}

// Response formatting helpers
export function formatPaginationResponse<T>(
  items: T[],
  pagination: {
    limit: number
    cursor?: string
    nextCursor?: string
    totalCount?: number
  }
) {
  return {
    items,
    pagination: {
      limit: pagination.limit,
      cursor: pagination.cursor,
      nextCursor: pagination.nextCursor,
      hasMore: !!pagination.nextCursor,
      totalCount: pagination.totalCount
    }
  }
}

// Validation error formatting
export function formatValidationErrors(error: z.ZodError) {
  return {
    issues: error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    })),
    message: 'Validation failed'
  }
}

// Common validation utilities
export function validateUUID(value: string, fieldName = 'ID'): string {
  try {
    return uuidSchema.parse(value)
  } catch {
    throw new Error(`Invalid ${fieldName} format`)
  }
}

export function validateNonEmptyString(value: string, fieldName = 'value'): string {
  try {
    return nonEmptyStringSchema.parse(value)
  } catch {
    throw new Error(`${fieldName} cannot be empty`)
  }
}

export function validateFile(file: File): void {
  try {
    fileValidationSchema.parse({
      size: file.size,
      type: file.type
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0].message)
    }
    throw error
  }
}