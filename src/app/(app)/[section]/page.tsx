import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'
import PlexusBackground from '@/components/LazyPlexus'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/lib/seo'
import { readLocale, translateBatch } from '@/lib/translate.server'
import { DEFAULT_LOCALE } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>
}): Promise<Metadata> {
  try {
    const { section: slug } = await params
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'sections',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const section: any = res.docs[0]
    if (!section) return {}
    const title = `${section.name} · ReportersDesk`
    const description = section.description || `Reporting from the ${section.name} desk at ReportersDesk.`
    const canonical = `${SITE_URL}/${slug}`
    return {
      metadataBase: new URL(SITE_URL),
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, type: 'website', url: canonical, siteName: 'ReportersDesk' },
      twitter: { card: 'summary', title, description },
    }
  } catch {
    return {}
  }
}

export default async function SectionArchive({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>
  searchParams: Promise<{ lang?: string | string[] }>
}) {
  const resolvedParams = await params;
  const sp = await searchParams
  const payload = await getPayload({ config })

  // Resolve the section from the Sections collection by slug (the hardcoded
  // SECTIONS list carries no Payload id to query stories by).
  const sectionResult = await payload.find({
    collection: 'sections',
    where: { slug: { equals: resolvedParams.section } },
    limit: 1,
  })
  const section = sectionResult.docs[0]

  if (!section) {
    notFound()
  }

  // A parent section (e.g. Visual Essay) lists stories from itself AND all its
  // subsections (Photo Essay, Video Documentary), so the main desk shows both.
  const children = await payload.find({
    collection: 'sections',
    where: { parent: { equals: section.id } },
    limit: 50,
    depth: 0,
  })
  const sectionIds = [section.id, ...children.docs.map((c: any) => c.id)]

  const stories = await payload.find({
    collection: 'stories',
    where: {
      'section': {
        in: sectionIds,
      },
      'status': {
        equals: 'published',
      }
    },
    sort: '-publishedAt',
    limit: 20,
  })

  // Translate the section chrome + each story card into the reader's language
  // when a non-English locale is active (same Vertex path the homepage and story
  // pages use). English passes straight through untouched.
  const locale = await readLocale(sp.lang)
  let sectionName: string = section.name
  let sectionDesc: string = section.description || ''
  const ui = {
    home: '← Home',
    archive: 'Archive',
    imprint: 'A Reporters Desk imprint ↗',
    empty: 'No published stories in this desk yet.',
    noMedia: 'No Media',
  }
  let storyDocs: any[] = stories.docs
  if (locale !== DEFAULT_LOCALE) {
    const uiKeys = Object.keys(ui) as (keyof typeof ui)[]
    const [secT, uiT] = await Promise.all([
      translateBatch([sectionName, sectionDesc], locale),
      translateBatch(uiKeys.map((k) => ui[k]), locale),
    ])
    sectionName = secT[0] || sectionName
    sectionDesc = secT[1] || sectionDesc
    uiKeys.forEach((k, i) => {
      ui[k] = uiT[i] || ui[k]
    })
    const cardText = storyDocs.flatMap((s: any) => [
      s.headline || '',
      s.strap || '',
      (typeof s.issueTags?.[0] === 'object' ? s.issueTags[0]?.title : s.issueTags?.[0]) || '',
    ])
    const t = await translateBatch(cardText, locale)
    storyDocs = storyDocs.map((s: any, i: number) => ({
      ...s,
      headline: t[i * 3] || s.headline,
      strap: t[i * 3 + 1] || s.strap,
      _tagLabel: t[i * 3 + 2] || undefined,
    }))
  }

  // On thelongpress.org this section index IS the imprint's home page, so it
  // wears the LongPress masthead instead of the "← Home / Archive" strip.
  const host = (await headers()).get('host')?.toLowerCase() ?? ''
  const isLongPress = host === 'thelongpress.org' || host === 'www.thelongpress.org'

  return (
    <div className="relative min-h-screen font-sans selection:bg-stone-300 selection:text-stone-900 bg-stone-50">
      <PlexusBackground className="fixed inset-0 z-0 pointer-events-none" />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-6 md:px-12 py-24 flex flex-col min-h-screen">
        {isLongPress ? (
          <header className="flex justify-between items-center mb-24 border-b border-stone-300 pb-6">
            <Link href="/" className="text-2xl md:text-3xl font-serif font-black tracking-tight text-stone-900">
              The Long Press
            </Link>
            <a
              href="https://reporters-desk.org"
              className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500 hover:text-stone-900 transition-colors"
            >
              {ui.imprint}
            </a>
          </header>
        ) : (
          <header className="flex justify-between items-center mb-24 border-b border-stone-300 pb-6">
            <Link href="/" className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500 hover:text-stone-900 transition-colors">
              {ui.home}
            </Link>
            <div className="text-xs uppercase tracking-widest font-bold text-stone-900">
              {sectionName} {ui.archive}
            </div>
          </header>
        )}

        <div className="mb-24 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter uppercase text-stone-900 mix-blend-multiply">
            {sectionName}
          </h1>
          {sectionDesc && (
            <p className="mt-6 text-xl text-stone-600 font-sans max-w-2xl">
              {sectionDesc}
            </p>
          )}
        </div>

        {storyDocs.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-stone-300">
            <p className="text-stone-500 font-serif italic text-xl">{ui.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {storyDocs.map((story: any) => (
              <Link
                // Link to the story's OWN section slug (may be a subsection),
                // so aggregated parent-section listings resolve correctly.
                href={`/${(story.section && typeof story.section === 'object' && story.section.slug) || resolvedParams.section}/${story.slug}`}
                key={story.id}
                className="group flex flex-col"
              >
                <div className="aspect-[4/3] bg-stone-200 mb-6 overflow-hidden">
                  {story.heroMedia ? (
                    <img 
                      src={story.heroMedia.url} 
                      alt={story.heroMedia.alt || story.headline}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif italic">
                      {ui.noMedia}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-500" suppressHydrationWarning>
                    {new Date(story.publishedAt || story.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {story.issueTags && story.issueTags.length > 0 && (
                    <>
                      <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                      <span className="text-xs font-bold uppercase tracking-widest text-stone-500 truncate">
                        {story._tagLabel ?? (typeof story.issueTags[0] === 'object' ? story.issueTags[0].title : story.issueTags[0])}
                      </span>
                    </>
                  )}
                </div>
                <h3 className="text-2xl font-serif font-bold text-stone-900 group-hover:underline underline-offset-4 decoration-2 decoration-stone-900 mb-3 leading-tight">
                  {story.headline}
                </h3>
                <p className="text-stone-600 font-sans text-sm line-clamp-3">
                  {story.strap}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
