import { getPayload } from 'payload'
import config from '@/payload.config'

export type Episode = {
  id: string | number
  title: string
  slug: string
  audioUrl: string | null
  audioMime: string
  coverUrl: string | null
  episodeNumber: number | null
  publishDate: string | null
  duration: string | null
  guests: string | null
  dek: string | null
  showNotes: any
  transcript: string | null
}

function mediaUrl(m: any): string | null {
  if (!m) return null
  if (typeof m === 'string') return null // unpopulated id
  return m.url ?? null
}

function toEpisode(doc: any): Episode {
  return {
    id: doc.id,
    title: doc.title ?? '',
    slug: doc.slug ?? String(doc.id),
    audioUrl: mediaUrl(doc.audio),
    audioMime: (typeof doc.audio === 'object' && doc.audio?.mimeType) || '',
    coverUrl: mediaUrl(doc.coverArt),
    episodeNumber: typeof doc.episodeNumber === 'number' ? doc.episodeNumber : null,
    publishDate: doc.publishDate ?? null,
    duration: doc.duration ?? null,
    guests: doc.guests ?? null,
    dek: doc.dek ?? null,
    showNotes: doc.showNotes ?? null,
    transcript: doc.transcript ?? null,
  }
}

/** All published episodes, newest first (by episode number, then publish date). */
export async function getEpisodes(): Promise<Episode[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'podcasts' as any,
      where: { status: { equals: 'published' } },
      depth: 1,
      limit: 200,
      sort: '-publishDate',
    })
    const eps = res.docs.map(toEpisode)
    // Prefer explicit episode numbers descending when present.
    eps.sort((a, b) => {
      if (a.episodeNumber != null && b.episodeNumber != null) return b.episodeNumber - a.episodeNumber
      if (a.episodeNumber != null) return -1
      if (b.episodeNumber != null) return 1
      return (b.publishDate ?? '').localeCompare(a.publishDate ?? '')
    })
    return eps
  } catch {
    return []
  }
}

export async function episodeBySlug(slug: string): Promise<Episode | null> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'podcasts' as any,
      where: { slug: { equals: slug }, status: { equals: 'published' } },
      depth: 1,
      limit: 1,
    })
    return res.docs[0] ? toEpisode(res.docs[0]) : null
  } catch {
    return null
  }
}

export function displayEpDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}
