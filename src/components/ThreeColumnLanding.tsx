'use client'

import { useState } from 'react'
import Masthead from '../shell/Masthead'
import FooterTabs from '../shell/FooterTabs'
import LiveDispatchesWidget from '../shell/LiveDispatches'
import PlexusBackground from '../three/PlexusBackground'
import type { Story } from '../../lib/types'

export default function ThreeColumnLanding({ stories }: { stories: Story[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <main className="landing landing--three-column">
      <PlexusBackground
        className="landing-canvas"
        nodeCount={70}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={0.5}
        focusIndex={hovered}
      />
      <Masthead />
      <div className="three-col-grid">
        {stories.slice(0, 3).map((story, i) => (
          <a
            key={story.id}
            href={`/stories/${story.id}`}
            className="three-col-card"
            style={{ backgroundImage: `url(${story.heroImage})` }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="three-col-section">{story.section}</span>
            <h2 className="three-col-headline">{story.headline}</h2>
            <p className="three-col-strap">{story.strap}</p>
          </a>
        ))}
      </div>
      <LiveDispatchesWidget />
      <FooterTabs />
    </main>
  )
}
