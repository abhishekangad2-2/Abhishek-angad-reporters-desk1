import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.reportersdesk.abhishekangad.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
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
