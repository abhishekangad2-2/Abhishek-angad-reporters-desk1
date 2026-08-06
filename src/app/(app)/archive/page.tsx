import type { Metadata } from 'next'
import Link from 'next/link'
import { getEntries, entriesByCategory, displayDate } from '@/lib/archive'
import './archive.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Abhishek Angad — Reportage Archive',
  description:
    'A collected archive of reportage by Abhishek Angad — politics, investigations, health, climate and criminal justice — published in The Indian Express and Hindustan Times.',
}

export default async function ArchiveIndex() {
  const entries = await getEntries()
  const groups = entriesByCategory(entries)
  const total = entries.length

  return (
    <div className="arc">
      <header className="arc-masthead">
        <span className="arc-eyebrow">Reportage · Clips Archive</span>
        <h1 className="arc-wordmark">Abhishek Angad</h1>
        <span className="arc-rule" aria-hidden />
        <p className="arc-tagline">
          {total} stories · The Indian Express &amp; Hindustan Times
        </p>
      </header>

      <section className="arc-bio">
        <p>
          Abhishek Angad is a journalist reporting from Jharkhand, with bylines in{' '}
          <em>The Indian Express</em> and <em>Hindustan Times</em>. His work spans political
          reporting, long-form investigations, health, climate and the criminal-justice system.
        </p>
        <ul className="arc-awards">
          <li>
            <span className="arc-award-badge">Award</span>
            <strong>Red Ink Award</strong> — Political Reporting, 2021
          </li>
          <li>
            <span className="arc-award-badge">Award</span>
            <strong>IIMC Jury Award</strong> — Climate Change reporting, for the drip-irrigation
            scam investigation
          </li>
        </ul>
      </section>

      <nav className="arc-jump" aria-label="Beats">
        {groups.map((g) => (
          <a key={g.category} href={`#${slugId(g.category)}`}>
            {g.category} <span>{g.entries.length}</span>
          </a>
        ))}
      </nav>

      <main className="arc-body">
        {groups.map((g) => (
          <section key={g.category} id={slugId(g.category)} className="arc-beat">
            <h2 className="arc-beat-h">
              {g.category} <span className="arc-beat-count">{g.entries.length}</span>
            </h2>
            <ul className="arc-list">
              {g.entries.map((e) => (
                <li key={e.slug} className="arc-item">
                  <Link href={`/archive/${e.slug}`} className="arc-item-title">
                    {e.title}
                  </Link>
                  <div className="arc-item-meta">
                    {e.outlet && <span className="arc-outlet">{e.outlet}</span>}
                    <span className="arc-date">{displayDate(e)}</span>
                  </div>
                  {e.dek && <p className="arc-item-dek">{e.dek}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <footer className="arc-foot">
        <a href="https://reporters-desk.org">← ReportersDesk</a>
        <span>Archive of published clips · rights with the original publications</span>
      </footer>
    </div>
  )
}

function slugId(cat: string): string {
  return cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
