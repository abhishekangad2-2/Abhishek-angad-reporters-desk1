// Edge-safe client-IP extraction from X-Forwarded-For. NO side effects (so it
// can be imported by both middleware (Edge runtime) and Node route handlers).
//
// Security: a client can prepend arbitrary values to X-Forwarded-For, but it
// CANNOT control the hop(s) appended by trusted infrastructure. On Cloud Run /
// Google Front End the real connecting IP is appended on the RIGHT, so we read
// from the right, skipping a configurable number of trusted proxy hops.
//
// TRUSTED_PROXY_HOPS = number of infrastructure proxies that append to XFF in
// front of the app (default 0 = the right-most entry is the client, correct for
// Cloud Run + domain mapping). If you later front the app with an external HTTPS
// load balancer that appends its own hop, set this to 1, etc.
const TRUSTED_PROXY_HOPS = (() => {
  const n = parseInt(process.env.TRUSTED_PROXY_HOPS || '0', 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
})()

export function clientIpFromXff(xff: string | null | undefined): string {
  const parts = (xff || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return 'unknown'
  // Right-most minus the trusted infrastructure hops = the real client IP that
  // the client cannot forge.
  const idx = parts.length - 1 - TRUSTED_PROXY_HOPS
  return parts[idx >= 0 ? idx : 0] || 'unknown'
}
