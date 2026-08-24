import type { Metadata } from 'next'
import Link from 'next/link'
import Masthead from '@/components/Masthead'
import { getEpisodes, displayEpDate } from '@/lib/podcasts'
import './podcast.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Reporters Desk Podcast',
  description:
    'Audio dispatches, interviews and field recordings from Abhishek Angad and Reporters Desk.',
}

export default async function PodcastIndex() {
  const episodes = await getEpisodes()

  return (
    <div className="pod">
      <Masthead />
      <main className="pod-main">
        <header className="pod-head">
          <span className="pod-kicker">Listen · Audio</span>
          <h1 className="pod-title">The Reporters Desk Podcast</h1>
          <p className="pod-dek">
            Interviews, field recordings and audio dispatches — reporting you can listen to.
          </p>
        </header>

        {episodes.length === 0 ? (
          <p className="pod-empty">No episodes published yet.</p>
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
                    {ep.guests && <span className="pod-guests">With {ep.guests}</span>}
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
