import Masthead from './Masthead'
import PlexusBackground from './PlexusBackground'
import { buildCards, type LandingData } from '@/lib/landing'

/** Phase 8 — print-grid broadsheet. Faint Plexus watermark in the masthead band
 *  only; lead + rail filled from real stories, backfilled with editorial desks. */
export default function NewspaperLanding({ data }: { data: LandingData }) {
  const cards = buildCards(data, 6)
  const lead = cards[0]
  const secondary = cards.slice(1, 3)
  const briefs = cards.slice(3, 7)

  return (
    <div className="landing landing--newspaper">
      <div className="newspaper-masthead-band">
        <PlexusBackground
          className="landing-canvas landing-canvas--thin"
          nodeCount={28}
          color="#14171c"
          lineColor="#b43d2a"
          intensity={0.16}
        />
        <Masthead sections={data.sections} labels={data.labels} />
      </div>

      {lead ? (
        <div className="newspaper-grid">
          <article className="newspaper-lead">
            {lead.heroUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="newspaper-lead-img" src={lead.heroUrl} alt={lead.headline} />
            )}
            <span className="newspaper-section">{lead.kicker}</span>
            <a href={lead.href} className="newspaper-lead-link">
              <h1>{lead.headline}</h1>
            </a>
            <p className="newspaper-dropcap">{lead.strap}</p>
          </article>

          <aside className="newspaper-secondary">
            {secondary.map((c, i) => (
              <a key={i} href={c.href} className="newspaper-sec-item">
                <span className="newspaper-section">{c.kicker}</span>
                <h3>{c.headline}</h3>
                <p>{c.strap}</p>
              </a>
            ))}
          </aside>

          <aside className="newspaper-briefs">
            <h4>More from the desks</h4>
            <ul>
              {briefs.map((c, i) => (
                <li key={i}>
                  <a href={c.href}>{c.headline}</a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : (
        <p className="landing-empty">No published stories yet.</p>
      )}
    </div>
  )
}
