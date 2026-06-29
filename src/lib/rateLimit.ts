/**
 * Lightweight in-process IP rate limiter.
 * Cloud Run single-instance: this is sufficient for burst protection.
 * Entries auto-expire via TTL; no external dependency required.
 */

type Entry = { count: number; resetAt: number }
const store = new Map<string, Entry>()

// Prune expired entries every 10 minutes to avoid memory growth
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k)
  }
}, 10 * 60 * 1000)

/**
 * Returns true if the caller is within limits.
 * @param key   Usually `ip:route`
 * @param limit Max requests per window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

import { clientIpFromXff } from './clientIp'

export function getClientIp(req: Request): string {
  return clientIpFromXff((req as any).headers?.get?.('x-forwarded-for'))
}
