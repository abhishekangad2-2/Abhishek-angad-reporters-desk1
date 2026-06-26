import Masthead from './Masthead'
import PlexusBackground from './PlexusBackground'
import { buildCards, type LandingData } from '@/lib/landing'

/** Phase 7 — alternating Z-pattern rows (real stories backfilled with editorial
 *  desks) over one shared, faint Plexus canvas. */
export default function ZPatternLanding({ data }: { data: LandingData }) {
  const rows = buildCards(data, 3).slice(0, 5)

  return (
    <div className="landing landing--z-pattern">
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={60}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={0.35}
      />
      <Masthead sections={data.sections} labels={data.labels} />

      {rows.map((c, i) => (
        <section key={i} className={`z-row ${i % 2 === 1 ? 'z-row--reversed' : ''}`}>
          <div
            className="z-row-image"
            style={c.heroUrl ? { backgroundImage: `url(${c.heroUrl})` } : undefined}
          />
          <div className="z-row-text">
            <span className="three-col-section">{c.kicker}</span>
            <h2>{c.headline}</h2>
            <p>{c.strap}</p>
            <a className="z-row-link" href={c.href}>
              {c.kind === 'story' ? 'Read the story →' : 'Explore the desk →'}
            </a>
          </div>
        </section>
      ))}
    </div>
  )
}
