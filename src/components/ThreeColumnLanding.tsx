'use client'

import { useState } from 'react'
import Masthead from './Masthead'
import PlexusBackground from './PlexusBackground'
import type { LandingData } from '@/lib/landing'

/** Phase 6 — full-bleed three-column grid. The Plexus "leans in" toward the
 *  hovered column via focusIndex. Footer + Live Dispatches come from the
 *  shared shell in layout.tsx, so they are intentionally not rendered here. */
export default function ThreeColumnLanding({ data }: { data: LandingData }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const cards = data.stories.slice(0, 6)

  return (
    <div className="landing landing--three-column">
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={70}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={0.5}
        focusIndex={hovered}
      />
      <Masthead sections={data.sections} />

      {cards.length > 0 ? (
        <div className="three-col-grid">
          {cards.map((s, i) => (
            <a
              key={s.id}
              href={s.href}
              className="three-col-card"
              style={s.heroUrl ? { backgroundImage: `url(${s.heroUrl})` } : { backgroundColor: '#14171c' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="three-col-section">{s.sectionName}</span>
              <h2 className="three-col-headline">{s.headline}</h2>
              <p className="three-col-strap">{s.strap}</p>
            </a>
          ))}
        </div>
      ) : (
        <p className="landing-empty">No published stories yet.</p>
      )}
    </div>
  )
}
