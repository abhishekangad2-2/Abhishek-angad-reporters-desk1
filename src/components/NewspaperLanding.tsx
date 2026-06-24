import Masthead from '../shell/Masthead'
import FooterTabs from '../shell/FooterTabs'
import LiveDispatchesWidget from '../shell/LiveDispatches'
import PlexusBackground from '../three/PlexusBackground'
import type { Story } from '../../lib/types'

export default function NewspaperLanding({
  lead,
  secondary,
  briefs,
}: {
  lead: Story
  secondary: Story[]
  briefs: Story[]
}) {
  return (
    <main className="landing landing--newspaper">
      <div className="newspaper-masthead-band">
        <PlexusBackground
          className="landing-canvas landing-canvas--thin"
          nodeCount={28}
          color="#14171c"
          lineColor="#b43d2a"
          intensity={0.16}
        />
        <Masthead />
      </div>

      <div className="newspaper-grid">
        <article className="newspaper-lead">
          <span className="newspaper-section">{lead.section}</span>
          <h1>{lead.headline}</h1>
          <p className="newspaper-dropcap">{lead.strap}</p>
        </article>

        <aside className="newspaper-secondary">
          {secondary.map((s) => (
            <a key={s.id} href={`/stories/${s.id}`}>
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
                <a href={`/stories/${b.id}`}>{b.headline}</a>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <LiveDispatchesWidget />
      <FooterTabs />
    </main>
  )
}
