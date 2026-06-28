'use client'

import { useState } from 'react'
import Masthead from './Masthead'
import PlexusBackground from './PlexusBackground'
import { buildCards, type LandingData } from '@/lib/landing'

/** Phase 6 — full-bleed three-column grid. The Plexus IS the background; three
 *  minimal-text columns float over it (real stories, backfilled with editorial
 *  desks so it's never half-empty), and hovering a column lifts it on the
 *  z-axis while the network leans toward it. */
export default function ThreeColumnLanding({ data }: { data: LandingData }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const target = data.stories.length <= 3 ? 3 : 6
  const cards = buildCards(data, target).slice(0, target)

  return (
    <div className="landing landing--three-column">
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={95}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={0.75}
        focusIndex={hovered}
      />
      <Masthead sections={data.sections} labels={data.labels} />

      {cards.length > 0 ? (
        <div className="three-col-grid">
          {cards.map((c, i) => (
            <a
              key={i}
              href={c.href}
              className={`three-col-card ${c.heroUrl ? 'three-col-card--photo' : ''} ${hovered !== null && hovered !== i ? 'three-col-card--dim' : ''}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {c.heroUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="three-col-img" src={c.heroUrl} alt="" loading="lazy" />
                  <span className="three-col-scrim" />
                </>
              )}
              <span className="three-col-index">0{i + 1}</span>
              <span className="three-col-body">
                <span className="three-col-section">{c.kicker}</span>
                <h2 className="three-col-headline">{c.headline}</h2>
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p className="landing-empty">No published stories yet.</p>
      )}
    </div>
  )
}
