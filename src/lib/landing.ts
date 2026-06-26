import { getPayload } from 'payload'
import config from '@/payload.config'

export type LandingTemplate = 'three-column' | 'z-pattern' | 'newspaper' | 'immersive'

export const LANDING_TEMPLATES: LandingTemplate[] = [
  'three-column',
  'z-pattern',
  'newspaper',
  'immersive',
]

/** The template a reader sees at `/` when no ?layout override is present. */
export const DEFAULT_TEMPLATE: LandingTemplate = 'three-column'

export type LandingStory = {
  id: string
  headline: string
  strap: string
  sectionName: string
  href: string
  heroUrl: string | null
}

export type LandingSection = {
  name: string
  slug: string
  description?: string
}

export type LandingData = {
  stories: LandingStory[]
  sections: LandingSection[]
}

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

export function isLandingTemplate(value: unknown): value is LandingTemplate {
  return typeof value === 'string' && (LANDING_TEMPLATES as string[]).includes(value)
}
