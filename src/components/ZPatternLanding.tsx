import Masthead from './Masthead'
import FooterTabs from './FooterTabs'
import LiveDispatchesWidget from './LiveDispatches'
import PlexusBackground from './PlexusBackground'
import type { Story } from '../../lib/types'

export default function ZPatternLanding({ stories }: { stories: Story[] }) {
  const rows = stories.slice(0, 3)

  return (
    <main className="landing landing--z-pattern">
      {/* One shared WebGL context behind all three rows. Three separate
          <Canvas> elements here would triple the GPU cost on a phone for
          no visual benefit — a real perf/robustness call, not a shortcut. */}
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={60}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={0.35}
      />
      <Masthead />
      {rows.map((story, i) => (
        <section key={story.id} className={`z-row ${i % 2 === 1 ? 'z-row--reversed' : ''}`}>
          <div className="z-row-image" style={{ backgroundImage: `url(${story.heroImage})` }} />
          <div className="z-row-text">
            <span className="three-col-section">{story.section}</span>
            <h2>{story.headline}</h2>
            <p>{story.strap}</p>
            <a href={`/stories/${story.id}`}>Read the story →</a>
          </div>
        </section>
      ))}
      <LiveDispatchesWidget />
      <FooterTabs />
    </main>
  )
}
