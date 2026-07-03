// Pure, client-safe landing helpers and types. MUST NOT import `payload` or
// `@/payload.config` — these are imported by 'use client' templates, and
// pulling the server-only Payload/@google-cloud/grpc deps into a client bundle
// breaks `next build`. The data loader lives in landing.server.ts.

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

export type LandingLabels = {
  editorialDesk: string
  /** Template for desk-card strap; `{desk}` is replaced with the desk name. */
  deskStrap: string
  est: string
  editor: string
}

export const DEFAULT_LABELS: LandingLabels = {
  editorialDesk: 'Editorial Desk',
  deskStrap: 'Reporting and live dispatches from the {desk} desk.',
  est: 'Est. 2026',
  editor: 'Editor login',
}

export type LandingData = {
  stories: LandingStory[]
  sections: LandingSection[]
  labels?: LandingLabels
  /** Editor's Design Studio choices (palette + simulation). Optional so
   *  existing callers/tests without a design still render with defaults. */
  design?: import('./design').DesignConfig
}

export function isLandingTemplate(value: unknown): value is LandingTemplate {
  return typeof value === 'string' && (LANDING_TEMPLATES as string[]).includes(value)
}

/** A uniform card the templates render, whether it's a real story or an
 *  editorial-desk promo used to backfill a sparse landing. */
export type LandingCard = {
  kind: 'story' | 'desk'
  kicker: string
  headline: string
  strap: string
  href: string
  heroUrl: string | null
}

/** Build at least `min` cards: real published stories first, then editorial
 *  desks as promos so the landing always looks full, with 1 story or 20. */
export function buildCards(data: LandingData, min: number): LandingCard[] {
  const labels = data.labels ?? DEFAULT_LABELS
  const cards: LandingCard[] = data.stories.map((s) => ({
    kind: 'story',
    kicker: s.sectionName,
    headline: s.headline,
    strap: s.strap,
    href: s.href,
    heroUrl: s.heroUrl,
  }))
  for (const sec of data.sections) {
    if (cards.length >= min) break
    cards.push({
      kind: 'desk',
      kicker: labels.editorialDesk,
      headline: sec.name,
      strap: sec.description || labels.deskStrap.replace('{desk}', sec.name),
      href: `/${sec.slug}`,
      heroUrl: null,
    })
  }
  return cards
}
