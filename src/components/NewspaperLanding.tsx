import Masthead from './Masthead'
import PlexusBackground from './PlexusBackground'
import type { LandingData } from '@/lib/landing'

/** Phase 8 — print-grid broadsheet. Plexus is deliberately near-invisible
 *  (a faint watermark in the masthead band only) so the page reads as print.
 *  Footer + Live Dispatches come from the shared shell in layout.tsx. */
export default function NewspaperLanding({ data }: { data: LandingData }) {
  const [lead, ...rest] = data.stories
  const secondary = rest.slice(0, 2)
  const briefs = rest.slice(2, 7)

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
        <Masthead sections={data.sections} />
      </div>

      {lead ? (
        <div className="newspaper-grid">
          <article className="newspaper-lead">
            {lead.heroUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="newspaper-lead-img" src={lead.heroUrl} alt={lead.headline} />
            )}
            <span className="newspaper-section">{lead.sectionName}</span>
            <a href={lead.href} className="newspaper-lead-link">
              <h1>{lead.headline}</h1>
            </a>
            <p className="newspaper-dropcap">{lead.strap}</p>
          </article>

          <aside className="newspaper-secondary">
            {secondary.map((s) => (
              <a key={s.id} href={s.href} className="newspaper-sec-item">
                <span className="newspaper-section">{s.sectionName}</span>
                <h3>{s.headline}</h3>
                <p>{s.strap}</p>
              </a>
            ))}
          </aside>

          <aside className="newspaper-briefs">
            <h4>In brief</h4>
            <ul>
              {briefs.map((b) => (
                <li key={b.id}>
                  <a href={b.href}>{b.headline}</a>
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
