'use client'

import { useState, type CSSProperties } from 'react'
import Masthead from './Masthead'
import { buildCards, type LandingData } from '@/lib/landing'
import { designCssVars, DEFAULT_DESIGN } from '@/lib/design'

/** Phase 6 — full-bleed three-column grid. Three minimal-text columns over a
 *  clean palette background (real stories, backfilled with editorial desks so
 *  it's never half-empty); hovering a column lifts it on the z-axis and dims
 *  the others. The floating plexus background was removed by request — it read
 *  as a stray "web" with no purpose. Palette comes from the Design Studio. */
export default function ThreeColumnLanding({ data }: { data: LandingData }) {
  const [hovered, setHovered] = useState<number | null>(null)
  // Exactly three stories — one per full-bleed column, each running deep.
  const cards = buildCards(data, 3).slice(0, 3)
  const design = data.design ?? DEFAULT_DESIGN

  return (
    <div className="landing landing--three-column" style={designCssVars(design) as CSSProperties}>
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
