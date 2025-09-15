export type GenerationErrorCode =
  | 'start_interrupted'
  | 'upstream_timeout'
  | 'upstream_capacity'
  | 'input_invalid'
  | 'storage_download'
  | 'storage_upload'
  | 'unknown'

export type ErrorClassification = {
  code: GenerationErrorCode
  provider_code?: string
  message?: string
}

// Map provider error strings to a stable internal code
export function mapProviderError(message?: string): ErrorClassification {
  const msg = (message || '').toLowerCase()
  if (!msg) return { code: 'unknown' }

  // Known Replicate signals
  // "Prediction interrupted; please retry (code: PA)"
  const pa = /\b\(code:\s*([a-z0-9_-]+)\)/i.exec(message || '')
  if (msg.includes('interrupted') || (pa && pa[1].toUpperCase() === 'PA')) {
    return { code: 'start_interrupted', provider_code: pa ? pa[1].toUpperCase() : 'PA', message }
  }

  // Director E-codes like E6716 (Timeout Starting Prediction)
  const ecode = /(E\d{3,5})/i.exec(message || '')
  if (ecode) {
    const pc = ecode[1].toUpperCase()
    if (pc === 'E6716' || msg.includes('timeout starting')) {
      return { code: 'upstream_timeout', provider_code: pc, message }
    }
    return { code: 'unknown', provider_code: pc, message }
  }

  if (msg.includes('rate limit') || msg.includes('capacity') || msg.includes('429')) {
    return { code: 'upstream_capacity', message }
  }

  if (msg.includes('invalid') || msg.includes('unsupported') || msg.includes('bad request')) {
    return { code: 'input_invalid', message }
  }

  return { code: 'unknown', message }
}

export function mapStorageError(message?: string, isUpload = false): ErrorClassification {
  const code: GenerationErrorCode = isUpload ? 'storage_upload' : 'storage_download'
  return { code, message }
}

