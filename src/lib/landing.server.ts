import { getPayload } from 'payload'
import config from '@/payload.config'
import type { LandingData, LandingStory } from './landing'

// Server-only: imports Payload (and its @google-cloud/storage/grpc deps), so it
// must never be imported by a 'use client' component. Pure helpers/types live
// in ./landing.

function normalizeStory(story: any): LandingStory {
  const section = story?.section && typeof story.section === 'object' ? story.section : null
  const hero = story?.heroMedia && typeof story.heroMedia === 'object' ? story.heroMedia : null
  return {
    id: String(story?.id ?? Math.random()),
    headline: story?.headline ?? 'Untitled',
    strap: story?.strap ?? '',
    sectionName: section?.name ?? 'Feature',
    href: section?.slug ? `/${section.slug}/${story.slug}` : '#',
    heroUrl: hero?.url ?? null,
  }
}

/** Single source of landing data shared by every template, so a story
 *  published in the CMS shows up identically in all four layouts. */
export async function getLandingData(): Promise<LandingData> {
  try {
    const payload = await getPayload({ config })
    const [stories, sections] = await Promise.all([
      payload.find({
        collection: 'stories',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        depth: 1,
        limit: 9,
      }),
      payload.find({ collection: 'sections', sort: 'name', limit: 50 }),
    ])
    return {
      stories: stories.docs.map(normalizeStory),
      sections: sections.docs.map((s: any) => ({
        name: s.name,
        slug: s.slug,
        description: s.description,
      })),
    }
  } catch {
    return { stories: [], sections: [] }
  }
}
