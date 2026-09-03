import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
// A Content-Security-Policy is shipped in REPORT-ONLY mode: it never blocks a
// request, it only reports what an enforced policy *would* block. That's the
// tested-pass runway an enforced CSP needs — watch DevTools/reports for a while,
// confirm GA, YouTube, Razorpay and streamed CDN audio raise no violations, then
// promote this to the enforcing `Content-Security-Policy` header.
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://checkout.razorpay.com https://www.youtube.com https://s.ytimg.com",
  "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://api.razorpay.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://checkout.razorpay.com https://api.razorpay.com",
].join('; ')

// Applied to every response — the safe, high-value hardening headers.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
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
