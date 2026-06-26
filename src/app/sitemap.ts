import type { MetadataRoute } from 'next'
import { getLandingData } from '@/lib/landing.server'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://reportersdesk.abhishekangad.com'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const data = await getLandingData() // resilient: returns empty on error
  const sections = data.sections.map((s) => ({ url: `${SITE}/${s.slug}`, lastModified: now }))
  const stories = data.stories
    .filter((s) => s.href && s.href !== '#')
    .map((s) => ({ url: `${SITE}${s.href}`, lastModified: now }))
  return [{ url: SITE, lastModified: now }, ...sections, ...stories]
}
