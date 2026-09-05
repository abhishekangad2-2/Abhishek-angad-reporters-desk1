import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://reporters-desk.org'

export const dynamic = 'force-dynamic'

// Full crawlable index: the apex, every section landing page, and EVERY published
// story at /<section>/<slug>. Previously this only listed the handful of stories
// surfaced on the homepage (getLandingData), so most articles were absent from
// the sitemap. We query Payload directly for all `published` stories; on any
// failure we fall back to the landing-data set so a broken query can never make
// us serve an empty/invalid sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = [{ url: SITE, lastModified: now }]

  try {
    const payload = await getPayload({ config })

    // Section landing pages.
    const sections = await payload.find({
      collection: 'sections',
      depth: 0,
      limit: 200,
      pagination: false,
    })
    for (const s of sections.docs as any[]) {
      if (s?.slug) entries.push({ url: `${SITE}/${s.slug}`, lastModified: now })
    }

    // Every published story, at its canonical /<section>/<slug> URL.
    const stories = await payload.find({
      collection: 'stories',
      where: { status: { equals: 'published' } },
      depth: 1, // populate the section relationship so we get its slug
      limit: 5000,
      pagination: false,
    })
    for (const st of stories.docs as any[]) {
      const section =
        st?.section && typeof st.section === 'object' ? st.section : null
      if (section?.slug && st?.slug) {
        const lastModified = st?.updatedAt
          ? new Date(st.updatedAt)
          : st?.publishedAt
            ? new Date(st.publishedAt)
            : now
        entries.push({ url: `${SITE}/${section.slug}/${st.slug}`, lastModified })
      }
    }
    return entries
  } catch {
    // Resilient fallback: never serve a broken sitemap.
    try {
      const { getLandingData } = await import('@/lib/landing.server')
      const data = await getLandingData()
      for (const s of data.sections) {
        entries.push({ url: `${SITE}/${s.slug}`, lastModified: now })
      }
      for (const s of data.stories.filter((s) => s.href && s.href !== '#')) {
        entries.push({ url: `${SITE}${s.href}`, lastModified: now })
      }
    } catch {
      /* apex-only is still a valid sitemap */
    }
    return entries
  }
}
