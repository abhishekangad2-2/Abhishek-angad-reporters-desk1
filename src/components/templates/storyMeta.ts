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
