import { getPayload } from 'payload'
import config from '@/payload.config'
import type { LandingData, LandingStory } from './landing'
import { resolveDesign, DEFAULT_DESIGN, type DesignConfig } from './design'

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

/** The editor-chosen homepage layout. Design Studio is the source of truth;
 *  the legacy Integrations field is a fallback so the choice made before the
 *  Studio existed keeps working until the editor saves the Studio once.
 *  Falls back to null so the caller can apply its own default. */
export async function getLandingLayout(): Promise<string | null> {
  try {
    const payload = await getPayload({ config })
    const studio: any = await payload.findGlobal({ slug: 'design-studio', depth: 0 }).catch(() => null)
    if (studio?.layout) return studio.layout
    const g: any = await payload.findGlobal({ slug: 'integrations', depth: 0 })
    return g?.landingLayout ?? null
  } catch {
    return null
  }
}

/** The editor's Design Studio choices (palette + simulation), normalized so a
 *  half-filled or missing global can never break the homepage. */
export async function getLandingDesign(): Promise<DesignConfig> {
  try {
    const payload = await getPayload({ config })
    const g = await payload.findGlobal({ slug: 'design-studio', depth: 0 })
    return resolveDesign(g)
  } catch {
    return DEFAULT_DESIGN
  }
}

/** Single source of landing data shared by every template, so a story
 *  published in the CMS shows up identically in all four layouts. */
export async function getLandingData(): Promise<LandingData> {
  try {
    const payload = await getPayload({ config })
    const [latest, pinned, sections, design] = await Promise.all([
      payload.find({
        collection: 'stories',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        depth: 1,
        // Editorial rule: every landing layout presents exactly the three
        // latest stories (desk promos backfill only when fewer exist). One
        // extra so that removing a pinned story still leaves three.
        limit: 4,
      }),
      // An editor-pinned lead overrides recency for the hero slot.
      payload.find({
        collection: 'stories',
        where: { and: [{ status: { equals: 'published' } }, { isLead: { equals: true } }] },
        sort: '-publishedAt',
        depth: 1,
        limit: 1,
      }),
      payload.find({ collection: 'sections', sort: 'name', limit: 50 }),
      getLandingDesign(),
    ])
    // Lead slot: a pinned story wins; otherwise the most recent (the old rule).
    const lead = pinned.docs[0]
    const ordered = lead
      ? [lead, ...latest.docs.filter((d: any) => d.id !== lead.id)]
      : latest.docs
    return {
      stories: ordered.slice(0, 3).map(normalizeStory),
      sections: sections.docs.map((s: any) => ({
        name: s.name,
        slug: s.slug,
        description: s.description,
      })),
      design,
    }
  } catch {
    return { stories: [], sections: [], design: DEFAULT_DESIGN }
  }
}
