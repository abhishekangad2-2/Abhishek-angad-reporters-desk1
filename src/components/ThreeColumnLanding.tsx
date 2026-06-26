'use client'

import { useState } from 'react'
import Masthead from './Masthead'
import PlexusBackground from './PlexusBackground'
import type { LandingData } from '@/lib/landing'

/** Phase 6 — full-bleed three-column grid. The Plexus IS the background here:
 *  three minimal-text columns float over it, and hovering a column lifts it on
 *  the z-axis while the network leans toward it (focusIndex). Footer + Live
 *  Dispatches come from the shared shell in layout.tsx. */
export default function ThreeColumnLanding({ data }: { data: LandingData }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const cards = data.stories.slice(0, 3)

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
      <Masthead sections={data.sections} />

      {cards.length > 0 ? (
        <div className="three-col-grid">
          {cards.map((s, i) => (
            <a
              key={s.id}
              href={s.href}
              className={`three-col-card ${hovered !== null && hovered !== i ? 'three-col-card--dim' : ''}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="three-col-index">0{i + 1}</span>
              <span className="three-col-section">{s.sectionName}</span>
              <h2 className="three-col-headline">{s.headline}</h2>
            </a>
          ))}
        </div>
      ) : (
        <p className="landing-empty">No published stories yet.</p>
      )}
    </div>
  )
}
