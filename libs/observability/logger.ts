export const log = {
  info: (msg: string, meta?: any) => console.info(JSON.stringify({ lvl:'info', msg, ts: new Date().toISOString(), ...meta })),
  warn: (msg: string, meta?: any) => console.warn(JSON.stringify({ lvl:'warn', msg, ts: new Date().toISOString(), ...meta })),
  error: (msg: string, meta?: any) => console.error(JSON.stringify({ lvl:'error', msg, ts: new Date().toISOString(), ...meta })),
}