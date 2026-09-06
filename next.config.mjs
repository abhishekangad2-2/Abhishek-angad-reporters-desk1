import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
// Content-Security-Policy — now ENFORCED (was Report-Only). The source allowlist
// is unchanged from the report-only runway (GA/GTM, YouTube, and https: media/img
// for streamed CDN audio all remain permitted), so nothing that worked under
// report-only should break. Razorpay hosts were dropped along with the removed
// payment integration (support is UPI-only). `worker-src 'self' blob:` is added
// explicitly: Next.js and some libs spawn blob workers that would otherwise fall
// back to `default-src 'self'` and be blocked once the policy is enforced.
//
// REMAINING HARDENING (separate change): script-src still carries 'unsafe-inline'
// and 'unsafe-eval'. Removing them requires per-request nonces threaded through
// the app (middleware nonce + next/script strategy), so it is intentionally left
// for a dedicated pass rather than bundled here.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "worker-src 'self' blob:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.youtube.com https://s.ytimg.com",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
].join('; ')

// Applied to every response — the safe, high-value hardening headers.
// HSTS carries `preload`: the policy is already 2y + includeSubDomains; the token
// only takes effect once the apex is submitted at https://hstspreload.org, so
// confirm EVERY subdomain (cdn, archive, thelongpress, …) is HTTPS-only first —
// removal from the preload list is slow.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Content-Security-Policy', value: csp },
]

// Admin surfaces must never be indexed. robots.txt already Disallows them, but
// that only asks crawlers not to fetch — this header tells any crawler that does
// fetch not to index. Defense-in-depth for the CMS login + panel.
const noindexHeaders = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]

const nextConfig = {
  output: 'standalone',
  // Don't advertise the stack.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.reporters-desk.org' },
      { protocol: 'https', hostname: 'cdn.reportersdesk.abhishekangad.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
    // Cache optimised variants longer so repeat views don't re-hit the origin.
    minimumCacheTTL: 2592000, // 30 days
  },
  // Canonicalise the www host to the bare apex with a permanent redirect, for
  // both imprints, so search engines don't split ranking across www/non-www.
  // (http→https is handled upstream at the Google Frontend load balancer.)
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.reporters-desk.org' }],
        destination: 'https://reporters-desk.org/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.thelongpress.org' }],
        destination: 'https://thelongpress.org/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Admin surfaces: noindex (defense-in-depth alongside robots.txt Disallow).
      { source: '/cms', headers: noindexHeaders },
      { source: '/cms/:path*', headers: noindexHeaders },
      { source: '/admin-login', headers: noindexHeaders },
      // Immutable app icons / PWA assets — they never change in place.
      { source: '/icon-:size(\\d+).png', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/apple-icon.png', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/favicon.ico', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }] },
    ]
  },
  typescript: {
    // Build fails loud on type errors (tsc is clean). A failed build is
    // fail-safe: the deploy job's docker build stops, no new revision ships,
    // and prod keeps serving the last good image.
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default withPayload(nextConfig)
