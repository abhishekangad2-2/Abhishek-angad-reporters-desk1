import Link from 'next/link'
import PlexusBackground from '@/components/PlexusBackground'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

function sectionSlug(story: any): string | null {
  if (story?.section && typeof story.section === 'object') return story.section.slug ?? null
  return null
}

function storyHref(story: any): string | null {
  const slug = sectionSlug(story)
  return slug ? `/${slug}/${story.slug}` : null
}

async function getHomeData() {
  try {
    const payload = await getPayload({ config })
    const [stories, sections] = await Promise.all([
      payload.find({
        collection: 'stories',
        where: { status: { equals: 'published' } },
        sort: '-publishedAt',
        depth: 1,
        limit: 7,
      }),
      // Sections come from the collection so desk links use the real slugs
      // (the hardcoded lib slugs drift from the seeded collection slugs).
      payload.find({ collection: 'sections', sort: 'name', limit: 50 }),
    ])
    return { stories: stories.docs, sections: sections.docs }
  } catch {
    return { stories: [], sections: [] }
  }
}

export default async function Home() {
  const { stories, sections } = await getHomeData()
  const lead = stories[0]
  const rest = stories.slice(1)

  return (
    <div className="relative min-h-screen font-sans selection:bg-stone-300 selection:text-stone-900">
      {/* 3D WebGL Background — full-screen, behind content (z-0), non-interactive */}
      <PlexusBackground className="fixed inset-0 z-0 pointer-events-none" />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-6 md:px-12 py-24 flex flex-col min-h-screen">

        {/* Navigation & Admin Link */}
        <header className="flex justify-between items-center mb-24 border-b border-stone-300 pb-6">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500">
            Est. 2026
          </div>
          <Link
            href="/admin"
            className="text-xs uppercase tracking-widest font-bold border border-stone-900 px-6 py-2 hover:bg-stone-900 hover:text-stone-50 transition-colors duration-300"
          >
            Editor Login (CMS)
          </Link>
        </header>

        {/* Masthead */}
        <div className="flex flex-col justify-center max-w-5xl">
          <h2 className="text-stone-500 font-serif italic text-2xl md:text-3xl mb-4">
            Abhishek Angad Ink.
          </h2>
          <h1 className="text-7xl md:text-9xl font-serif font-black tracking-tighter uppercase leading-[0.85] text-stone-900 mix-blend-multiply">
            Reporters <br /> Desk
          </h1>
          <p className="mt-8 text-xl md:text-2xl font-sans font-light text-stone-600 max-w-2xl leading-relaxed">
            A unified intelligence platform for high-stakes investigative journalism. Featuring immersive narratives, live ground dispatches, and an iron-clad editorial workflow.
          </p>
        </div>

        {/* Latest Reporting — real published stories from the CMS */}
        {stories.length > 0 && (
          <section className="mt-32">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px bg-stone-900 flex-1"></div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900">Latest Reporting</h3>
              <div className="h-px bg-stone-900 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Lead story */}
              {lead && (
                <Link href={storyHref(lead) ?? '#'} className="lg:col-span-2 group no-underline block">
                  <div className="aspect-[16/9] bg-stone-200 mb-6 overflow-hidden">
                    {lead.heroMedia && typeof lead.heroMedia === 'object' && lead.heroMedia.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lead.heroMedia.url} alt={lead.headline} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif italic">ReportersDesk</div>
                    )}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">
                    {typeof lead.section === 'object' ? lead.section.name : 'Feature'}
                  </div>
                  <h2 className="text-4xl font-serif font-black text-stone-900 leading-tight mb-3 group-hover:underline underline-offset-4 decoration-2">
                    {lead.headline}
                  </h2>
                  <p className="text-lg text-stone-600 font-sans leading-relaxed max-w-2xl">{lead.strap}</p>
                </Link>
              )}

              {/* Secondary rail */}
              <div className="flex flex-col divide-y divide-stone-200">
                {rest.map((story: any) => (
                  <Link key={story.id} href={storyHref(story) ?? '#'} className="group no-underline py-6 first:pt-0">
                    <div className="text-[0.65rem] font-bold uppercase tracking-widest text-stone-500 mb-2">
                      {typeof story.section === 'object' ? story.section.name : 'Feature'}
                    </div>
                    <h4 className="text-xl font-serif font-bold text-stone-900 leading-snug mb-1 group-hover:underline underline-offset-4">
                      {story.headline}
                    </h4>
                    <p className="text-sm text-stone-600 font-sans line-clamp-2">{story.strap}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Editorial Desks Grid */}
        <div className="mt-32">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-stone-900 flex-1"></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900">The Editorial Desks</h3>
            <div className="h-px bg-stone-900 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
            {sections.map((section: any, idx: number) => (
              <Link key={section.slug} href={`/${section.slug}`} className="group cursor-pointer no-underline">
                <div className="text-stone-400 font-serif text-5xl mb-2 group-hover:text-stone-900 transition-colors duration-500">
                  0{idx + 1}
                </div>
                <h4 className="text-lg font-bold font-sans uppercase tracking-wide text-stone-900 mb-2 group-hover:underline underline-offset-4">
                  {section.name}
                </h4>
                <p className="text-sm text-stone-600 font-sans leading-relaxed">
                  {section.description || `Archives and live reports from the ${section.name} desk.`}
                </p>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
