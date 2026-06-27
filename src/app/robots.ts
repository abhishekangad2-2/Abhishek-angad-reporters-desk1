import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportersdesk.abhishekangad.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/cms', '/admin-login', '/api/'] },
    sitemap: `${SITE}/sitemap.xml`,
  }
}
