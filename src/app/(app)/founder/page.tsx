import { readLocale, translateBatch } from '@/lib/translate.server'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import FounderClient, { type FounderContent } from './FounderClient'

export const dynamic = 'force-dynamic'

const TIMELINE = [
  { year: 'The beat', title: 'Ground reportage from Jharkhand & eastern India', body: 'Reporting where policy meets the people it is meant to serve — public health, the rural belt, and the distan[...]' },
  { year: 'Accountability', title: 'Following the money', body: 'Where public money was meant to go, and where it actually went — budgets, schemes, and the institutions answerable for them.' },
  { year: 'Elections', title: 'The integrity of the rolls', body: 'Booth-level scrutiny of electoral revisions and the trust deficit they expose, from the West Bengal SIR onward.' },
  { year: 'Form', title: 'Visual & audio investigations', body: 'Photo essays, field video and recorded testimony — telling the story in the medium the story demands.' },
  { year: 'Now', title: 'ReportersDesk', body: 'A reader-funded home for independent, long-form ground reportage — no paywall on the reporting, supported directly by the people who value it.' },
]

const KICKER = 'Founder & reporter'
const LEDE =
  'An independent journalist reporting from Jharkhand and eastern India — public health, the rural belt, electoral integrity, and where public money is spent. ReportersDesk is his reader-funded home for long-form ground reportage and visual investigations.'
const BACK = '← Back to ReportersDesk'
const CONTACT = 'Get in touch'

export default async function FounderPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>
}) {
  const sp = await searchParams
  const locale = await readLocale(sp.lang)

  const content: FounderContent = {
    avatar: 'https://cdn.reporters-desk.org/IMG_20240801_152018.jpg',
    // Abhishek Angad is a proper name — never translated.
    name: 'Abhishek Angad',
    kicker: KICKER,
    lede: LEDE,
    timeline: TIMELINE.map((t) => ({ year: t.year, title: t.title, body: t.body })),
    back: BACK,
    contact: CONTACT,
  }

  // Translate the fixed copy (kicker, lede, timeline entries, footer) into the
  // reader's language via the same Vertex path as the rest of the site.
  if (locale !== DEFAULT_LOCALE) {
    const flat = [
      KICKER,
      LEDE,
      BACK,
      CONTACT,
      ...TIMELINE.flatMap((t) => [t.year, t.title, t.body]),
    ]
    const t = await translateBatch(flat, locale)
    content.kicker = t[0] || KICKER
    content.lede = t[1] || LEDE
    content.back = t[2] || BACK
    content.contact = t[3] || CONTACT
    content.timeline = TIMELINE.map((orig, i) => ({
      year: t[4 + i * 3] || orig.year,
      title: t[4 + i * 3 + 1] || orig.title,
      body: t[4 + i * 3 + 2] || orig.body,
    }))
  }

  return <FounderClient content={content} />
}
