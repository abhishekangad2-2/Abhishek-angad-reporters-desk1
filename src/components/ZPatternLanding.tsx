import Masthead from './Masthead'
import PlexusBackground from './PlexusBackground'
import type { LandingData } from '@/lib/landing'

/** Phase 7 — alternating Z-pattern rows. One fixed Plexus canvas sits behind
 *  all rows (a single shared WebGL context, not one per row). Footer + Live
 *  Dispatches come from the shared shell in layout.tsx. */
export default function ZPatternLanding({ data }: { data: LandingData }) {
  const rows = data.stories.slice(0, 5)

  return (
    <div className="landing landing--z-pattern">
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={60}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={0.35}
      />
      <Masthead sections={data.sections} />

      {rows.length > 0 ? (
        rows.map((s, i) => (
          <section key={s.id} className={`z-row ${i % 2 === 1 ? 'z-row--reversed' : ''}`}>
            <div
              className="z-row-image"
              style={s.heroUrl ? { backgroundImage: `url(${s.heroUrl})` } : undefined}
            />
            <div className="z-row-text">
              <span className="three-col-section">{s.sectionName}</span>
              <h2>{s.headline}</h2>
              <p>{s.strap}</p>
              <a className="z-row-link" href={s.href}>
                Read the story →
              </a>
            </div>
          </section>
        ))
      ) : (
        <p className="landing-empty">No published stories yet.</p>
      )}
    </div>
  )
}
