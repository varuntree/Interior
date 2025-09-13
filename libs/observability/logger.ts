type LogLevel = 'info' | 'warn' | 'error'

interface LogRecordBase {
  ts: string
  level: LogLevel
  event: string
}

type Fields = Record<string, unknown>

type Emitter = (level: LogLevel, event: string, fields?: Fields) => void

function redactor(fields?: Fields): Fields | undefined {
  if (!fields) return undefined
  // Shallow redaction for obvious PII; can be extended later
  const clone: Fields = { ...fields }
  for (const key of Object.keys(clone)) {
    if (/email/i.test(key)) clone[key] = '[redacted]'
    if (/prompt/i.test(key)) clone[key] = '[redacted]'
  }
  return clone
}

const defaultEmit: Emitter = (level, event, fields) => {
  const rec: LogRecordBase & { fields?: Fields } = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(fields ? { fields: redactor(fields) } : {}),
  }
  const line = JSON.stringify(rec)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export interface Logger {
  info: (event: string, fields?: Fields) => void
  warn: (event: string, fields?: Fields) => void
  error: (event: string, fields?: Fields) => void
  child: (extra: Fields) => Logger
  time: (label?: string, baseFields?: Fields) => { end: (extra?: Fields) => void }
}

function makeLogger(base: Fields = {}, emit: Emitter = defaultEmit): Logger {
  const call = (level: LogLevel, event: string, fields?: Fields) => {
    const merged = { ...base, ...(fields || {}) }
    emit(level, event, merged)
  }

  return {
    info: (event, fields) => call('info', event, fields),
    warn: (event, fields) => call('warn', event, fields),
    error: (event, fields) => call('error', event, fields),
    child: (extra: Fields) => makeLogger({ ...base, ...extra }, emit),
    time: (label = 'timed', baseFields?: Fields) => {
      const start = Date.now()
      return {
        end: (extra?: Fields) => {
          const durationMs = Date.now() - start
          const fields = { ...(baseFields || {}), ...(extra || {}), durationMs }
          call('info', label, fields)
        }
      }
    }
  }
}

// Backward‑compatible base logger (no context)
export const logger: Logger = makeLogger()

// Factory to create context loggers
export const createLogger = (base: Fields = {}): Logger => makeLogger(base)

// Helper: get logger from optional ctx
export function getLoggerFromCtx(
  ctx?: { logger?: Logger },
  extra?: Fields
): Logger {
  const base = ctx?.logger ?? logger
  return extra ? base.child(extra) : base
}
