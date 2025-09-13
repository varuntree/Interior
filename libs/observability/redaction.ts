export type Fields = Record<string, unknown>

const DEFAULT_DENYLIST = [/email/i, /prompt/i]

export function redact(fields?: Fields, denylist: RegExp[] = DEFAULT_DENYLIST): Fields | undefined {
  if (!fields) return undefined
  const out: Fields = { ...fields }
  for (const key of Object.keys(out)) {
    if (denylist.some((rx) => rx.test(key))) {
      out[key] = '[redacted]'
    }
  }
  return out
}

