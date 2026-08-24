import type { Story } from '@/payload-types'

/** Shared field extractors so all four story templates read a story the same way. */

export function sectionNameOf(story: Story): string {
  const s = story.section
  return ((typeof s === 'object' && s ? (s as any).name : s) ?? 'Feature') as string
}

export function heroUrlOf(story: Story): string | null {
  const h = story.heroMedia
  return h && typeof h === 'object' && 'url' in h ? ((h as any).url ?? null) : null
}

/** Photographer credit + source off the populated hero media (depth ≥ 1). */
export function heroCreditOf(story: Story): { credit: string | null; source: string | null } {
  const h: any = story.heroMedia
  if (!h || typeof h !== 'object') return { credit: null, source: null }
  return { credit: (h.credit ?? '').trim() || null, source: (h.source ?? '').trim() || null }
}

/** "Photograph: <credit> · Source: <source>" — omitting whichever is absent. */
export function heroCreditLine(story: Story): string | null {
  const { credit, source } = heroCreditOf(story)
  const parts: string[] = []
  if (credit) parts.push(`Photograph: ${credit}`)
  if (source) parts.push(`Source: ${source}`)
  return parts.length ? parts.join(' · ') : null
}

export function bylineOf(story: Story): string {
  const authors = (story as any).author
  if (!Array.isArray(authors)) return ''
  const names = authors
    .map((a: any) =>
      typeof a === 'object' && a?.firstName ? `${a.firstName} ${a.lastName ?? ''}`.trim() : '',
    )
    .filter(Boolean)
  return names.length ? `By ${names.join(', ')}` : ''
}
