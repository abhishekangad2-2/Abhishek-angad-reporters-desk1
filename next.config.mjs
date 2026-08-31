import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
// Applied to every response. A strict Content-Security-Policy is intentionally
// omitted here — the site loads GA, YouTube embeds, Razorpay and streamed CDN
// audio, so a CSP needs its own tested pass rather than a blanket rule that
// could silently break those. These are the safe, high-value hardening headers.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
]

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
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
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
