import type { Metadata } from 'next'
import Link from 'next/link'
import Masthead from '@/components/Masthead'
import { getEpisodes, displayEpDate } from '@/lib/podcasts'
import { readLocale, translateBatch } from '@/lib/translate.server'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import './podcast.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Reporters Desk Podcast',
  description:
    'Audio dispatches, interviews and field recordings from Abhishek Angad and Reporters Desk.',
}

export default async function PodcastIndex({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>
}) {
  const sp = await searchParams
  const locale = await readLocale(sp.lang)
  let episodes = await getEpisodes()

  const ui = {
    kicker: 'Listen · Audio',
    dek: 'Interviews, field recordings and audio dispatches — reporting you can listen to.',
    empty: 'No episodes published yet.',
    withLabel: 'With',
  }
  // Translate the page chrome + each episode's title/dek/guests into the
  // reader's language (the podcast name itself is a brand and stays as-is).
  if (locale !== DEFAULT_LOCALE) {
    const uiKeys = Object.keys(ui) as (keyof typeof ui)[]
    const [uiT, epT] = await Promise.all([
      translateBatch(uiKeys.map((k) => ui[k]), locale),
      translateBatch(
        episodes.flatMap((ep) => [ep.title || '', ep.dek || '', ep.guests || '']),
        locale,
      ),
    ])
    uiKeys.forEach((k, i) => {
      ui[k] = uiT[i] || ui[k]
    })
    episodes = episodes.map((ep, i) => ({
      ...ep,
      title: epT[i * 3] || ep.title,
      dek: epT[i * 3 + 1] || ep.dek,
      guests: epT[i * 3 + 2] || ep.guests,
    }))
  }

  return (
    <div className="pod">
      <Masthead />
      <main className="pod-main">
        <header className="pod-head">
          <span className="pod-kicker">{ui.kicker}</span>
          <h1 className="pod-title">The Reporters Desk Podcast</h1>
          <p className="pod-dek">
            {ui.dek}
          </p>
        </header>

        {episodes.length === 0 ? (
          <p className="pod-empty">{ui.empty}</p>
        ) : (
          <ul className="pod-list">
            {episodes.map((ep) => (
              <li key={ep.id} className="pod-item">
                <Link href={`/podcast/${ep.slug}`} className="pod-card">
                  {ep.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="pod-cover" src={ep.coverUrl} alt="" />
                  ) : (
                    <span className="pod-cover pod-cover--ph" aria-hidden>
                      ♪
                    </span>
                  )}
                  <span className="pod-meta">
                    <span className="pod-eyebrow">
                      {ep.episodeNumber != null && <span className="pod-num">EP {ep.episodeNumber}</span>}
                      {ep.publishDate && <span className="pod-date">{displayEpDate(ep.publishDate)}</span>}
                      {ep.duration && <span className="pod-dur">{ep.duration}</span>}
                    </span>
                    <span className="pod-h">{ep.title}</span>
                    {ep.dek && <span className="pod-sub">{ep.dek}</span>}
                    {ep.guests && <span className="pod-guests">{ui.withLabel} {ep.guests}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
