type LogLevel = 'info' | 'warn' | 'error'

interface LogRecord {
  ts: string
  level: LogLevel
  event: string
  fields?: Record<string, unknown>
}

function emit(level: LogLevel, event: string, fields?: Record<string, unknown>) {
  const rec: LogRecord = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(fields ? { fields } : {}),
  }
  const line = JSON.stringify(rec)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (event: string, fields?: Record<string, unknown>) => emit('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit('warn', event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit('error', event, fields),
  startTimer: () => {
    const start = Date.now()
    return () => Date.now() - start
  },
}

