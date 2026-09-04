import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Masthead from '@/components/Masthead'
import { WavePlayer } from '@/components/WavePlayer'
import { RichTextRenderer } from '@/components/LexicalRenderer'
import { episodeBySlug, displayEpDate } from '@/lib/podcasts'
import { readLocale, translateBatch } from '@/lib/translate.server'
import { DEFAULT_LOCALE } from '@/lib/i18n'
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

export default async function EpisodePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string | string[] }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const ep = await episodeBySlug(slug)
  if (!ep) notFound()

  const locale = await readLocale(sp.lang)
  const ui = {
    back: '← All episodes',
    withLabel: 'With',
    audioUnavailable: 'Audio for this episode is unavailable.',
    showNotes: 'Show notes',
  }
  // Translate the episode header + page chrome into the reader's language.
  // (Rich-text show notes stay in the source language for now — they need the
  // Lexical translation path, tracked separately.)
  let epTitle = ep.title
  let epDek = ep.dek
  let epGuests = ep.guests
  if (locale !== DEFAULT_LOCALE) {
    const uiKeys = Object.keys(ui) as (keyof typeof ui)[]
    const [uiT, fieldsT] = await Promise.all([
      translateBatch(uiKeys.map((k) => ui[k]), locale),
      translateBatch([ep.title || '', ep.dek || '', ep.guests || ''], locale),
    ])
    uiKeys.forEach((k, i) => {
      ui[k] = uiT[i] || ui[k]
    })
    epTitle = fieldsT[0] || ep.title
    epDek = fieldsT[1] || ep.dek
    epGuests = fieldsT[2] || ep.guests
  }

  return (
    <div className="pod">
      <Masthead />
      <main className="pod-main pod-episode">
        <Link href="/podcast" className="pod-back">
          {ui.back}
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
            <h1 className="pod-ep-title">{epTitle}</h1>
            {ep.guests && <p className="pod-ep-guests">{ui.withLabel} {epGuests}</p>}
            {ep.dek && <p className="pod-ep-dek">{epDek}</p>}
          </div>
        </header>

        {ep.audioUrl ? (
          <div className="pod-player">
            <WavePlayer
              src={ep.audioUrl}
              transcript={ep.transcript}
              peaks={ep.peaks}
              duration={ep.durationSeconds}
            />
          </div>
        ) : (
          <p className="pod-empty">{ui.audioUnavailable}</p>
        )}

        {ep.showNotes && (
          <section className="pod-notes news-body story-reading">
            <h2 className="pod-notes-h">{ui.showNotes}</h2>
            <RichTextRenderer content={ep.showNotes} />
          </section>
        )}
      </main>
    </div>
  )
}
