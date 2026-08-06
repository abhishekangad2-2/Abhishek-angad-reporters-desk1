import raw from '@/data/archive.json'

export type ArchiveEntry = {
  category: string
  title: string
  slug: string
  outlet: string
  outlet_inferred: boolean
  date: string | null
  year: string
  date_exact: boolean
  dek: string
  body: string
  source_file: string
}

// The seed JSON is the fallback: if the Payload `archive` collection is empty or
// unreachable (e.g. before the first seed), the site still renders from this.
const JSON_ENTRIES = raw as ArchiveEntry[]

export const CATEGORY_ORDER = [
  'Political Reporting',
  'Investigations',
  'Elections (ECI)',
  'Health',
  'Mob Violence',
  'Criminal Justice',
  'Climate',
  'Policy',
  'Profiles',
]

/** Load entries from the CMS (so admin edits show up); fall back to the seed
 *  JSON if the collection is empty or unavailable. Server-only. */
export async function getEntries(): Promise<ArchiveEntry[]> {
  try {
    const { getPayload } = await import('payload')
    const { default: config } = await import('@/payload.config')
    const payload = await getPayload({ config })
    const res = await payload.find({ collection: 'archive', limit: 1000, depth: 0 })
    if (!res.docs.length) return JSON_ENTRIES
    return res.docs.map(mapDoc)
  } catch {
    return JSON_ENTRIES
  }
}

function mapDoc(d: Record<string, unknown>): ArchiveEntry {
  const outlet = String(d.outlet ?? '')
  const publishDate = d.publishDate ? new Date(String(d.publishDate)) : null
  const dateExact = Boolean(d.dateExact)
  return {
    category: String(d.category ?? ''),
    title: String(d.title ?? ''),
    slug: String(d.slug ?? ''),
    outlet: outlet === 'none' ? '' : outlet,
    outlet_inferred: Boolean(d.outletInferred),
    date: dateExact && publishDate ? publishDate.toISOString().slice(0, 10) : null,
    year: String(d.year ?? ''),
    date_exact: dateExact,
    dek: String(d.dek ?? ''),
    body: String(d.body ?? ''),
    source_file: String(d.sourceFile ?? ''),
  }
}

export function entryBySlug(entries: ArchiveEntry[], slug: string): ArchiveEntry | undefined {
  return entries.find((e) => e.slug === slug)
}

/** Entries grouped by beat, beats in CATEGORY_ORDER, newest-first within a beat. */
export function entriesByCategory(entries: ArchiveEntry[]): { category: string; entries: ArchiveEntry[] }[] {
  const groups = new Map<string, ArchiveEntry[]>()
  for (const e of entries) {
    if (!groups.has(e.category)) groups.set(e.category, [])
    groups.get(e.category)!.push(e)
  }
  const ordered = [...groups.keys()].sort(
    (a, b) => (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99),
  )
  return ordered.map((category) => ({
    category,
    entries: groups.get(category)!.sort((a, b) => sortKey(b).localeCompare(sortKey(a))),
  }))
}

function sortKey(e: ArchiveEntry): string {
  return e.date ?? `${e.year}-06-15`
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function displayDate(e: ArchiveEntry): string {
  if (e.date_exact && e.date) {
    const [y, m, d] = e.date.split('-').map(Number)
    if (y && m && d) return `${d} ${MONTHS[m - 1]} ${y}`
  }
  return e.year
}

export function bodyParagraphs(e: ArchiveEntry): string[] {
  return e.body.split('\n\n').map((p) => p.trim()).filter(Boolean)
}
