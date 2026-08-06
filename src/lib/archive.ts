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

const ENTRIES = raw as ArchiveEntry[]

// Beat order for the index (most active beats first).
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

export function allEntries(): ArchiveEntry[] {
  return ENTRIES
}

export function entryBySlug(slug: string): ArchiveEntry | undefined {
  return ENTRIES.find((e) => e.slug === slug)
}

/** Entries grouped by beat, beats in CATEGORY_ORDER, newest-first within a beat. */
export function entriesByCategory(): { category: string; entries: ArchiveEntry[] }[] {
  const groups = new Map<string, ArchiveEntry[]>()
  for (const e of ENTRIES) {
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
  // exact date sorts precisely; year-only sorts to mid-year
  return e.date ?? `${e.year}-06-15`
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** "12 August 2022" for exact dates, "2024" for year-only. */
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
