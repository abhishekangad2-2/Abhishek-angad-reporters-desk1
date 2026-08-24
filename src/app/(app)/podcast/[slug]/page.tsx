import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Masthead from '@/components/Masthead'
import { WavePlayer } from '@/components/WavePlayer'
import { RichTextRenderer } from '@/components/LexicalRenderer'
import { episodeBySlug, displayEpDate } from '@/lib/podcasts'
import '../podcast.css'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const ep = await episodeBySlug(slug)
  if (!ep) return { title: 'Episode not found' }
  return {
    title: `${ep.title} — Reporters Desk Podcast`,
    description: ep.dek ?? undefined,
  }
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ep = await episodeBySlug(slug)
  if (!ep) notFound()

  return (
    <div className="pod">
      <Masthead />
      <main className="pod-main pod-episode">
        <Link href="/podcast" className="pod-back">
          ← All episodes
        </Link>

        <header className="pod-ep-head">
          {ep.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="pod-ep-cover" src={ep.coverUrl} alt="" />
          )}
          <div className="pod-ep-meta">
            <span className="pod-eyebrow">
              {ep.episodeNumber != null && <span className="pod-num">EP {ep.episodeNumber}</span>}
              {ep.publishDate && <span className="pod-date">{displayEpDate(ep.publishDate)}</span>}
              {ep.duration && <span className="pod-dur">{ep.duration}</span>}
            </span>
            <h1 className="pod-ep-title">{ep.title}</h1>
            {ep.guests && <p className="pod-ep-guests">With {ep.guests}</p>}
            {ep.dek && <p className="pod-ep-dek">{ep.dek}</p>}
          </div>
        </header>

        {ep.audioUrl ? (
          <div className="pod-player">
            <WavePlayer src={ep.audioUrl} transcript={ep.transcript} />
          </div>
        ) : (
          <p className="pod-empty">Audio for this episode is unavailable.</p>
        )}

        {ep.showNotes && (
          <section className="pod-notes news-body story-reading">
            <h2 className="pod-notes-h">Show notes</h2>
            <RichTextRenderer content={ep.showNotes} />
          </section>
        )}
      </main>
    </div>
  )
}
