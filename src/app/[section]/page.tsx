import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'
import PlexusBackground from '@/components/PlexusBackground'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SectionArchive({ params }: { params: Promise<{ section: string }> }) {
  const resolvedParams = await params;
  const payload = await getPayload({ config })
  
  const sections = await payload.find({
    collection: 'sections',
    where: {
      slug: {
        equals: resolvedParams.section,
      },
    },
    limit: 1,
  })

  if (!sections.docs.length) {
    notFound()
  }

  const section = sections.docs[0]

  const stories = await payload.find({
    collection: 'stories',
    where: {
      'section': {
        equals: section.id,
      },
      'status': {
        equals: 'published',
      }
    },
    sort: '-publishedAt',
    limit: 20,
  })

  return (
    <div className="relative min-h-screen font-sans selection:bg-stone-300 selection:text-stone-900 bg-stone-50">
      <PlexusBackground />

      <main className="relative z-10 max-w-screen-2xl mx-auto px-6 md:px-12 py-24 flex flex-col min-h-screen">
        <header className="flex justify-between items-center mb-24 border-b border-stone-300 pb-6">
          <Link href="/" className="text-xs uppercase tracking-[0.2em] font-bold text-stone-500 hover:text-stone-900 transition-colors">
            ← Home
          </Link>
          <div className="text-xs uppercase tracking-widest font-bold text-stone-900">
            {section.name} Archive
          </div>
        </header>

        <div className="mb-24 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter uppercase text-stone-900 mix-blend-multiply">
            {section.name}
          </h1>
          {section.description && (
            <p className="mt-6 text-xl text-stone-600 font-sans max-w-2xl">
              {section.description}
            </p>
          )}
        </div>

        {stories.docs.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-stone-300">
            <p className="text-stone-500 font-serif italic text-xl">No published stories in this desk yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {stories.docs.map((story: any) => (
              <Link 
                href={`/${resolvedParams.section}/${story.slug}`} 
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
                      No Media
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
                    {new Date(story.publishedAt || story.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {story.issueTags && story.issueTags.length > 0 && (
                    <>
                      <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                      <span className="text-xs font-bold uppercase tracking-widest text-stone-500 truncate">
                        {story.issueTags[0].name}
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
