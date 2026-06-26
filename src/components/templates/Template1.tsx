import { Story } from '@/payload-types'
import Masthead from '@/components/Masthead'
import PlexusBackground from '@/components/PlexusBackground'
import { LayoutRenderer } from '@/components/LexicalRenderer'
import { bylineOf, sectionNameOf } from './storyMeta'

/** Three-Column design (z-axis) at the story level: the full-bleed Plexus is
 *  the backdrop; the headline floats over it and the body sits on a translucent
 *  reading panel so it stays legible over the network. */
export default function Template1({ story }: { story: Story }) {
  const sectionName = sectionNameOf(story)
  const byline = bylineOf(story)

  return (
    <div className="story landing landing--three-column">
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={95}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={0.7}
      />
      <Masthead />

      <header className="story-hero">
        <div className="story-kicker">{sectionName}</div>
        <h1 className="story-title">{story.headline}</h1>
        {story.strap && <p className="story-strap">{story.strap}</p>}
        {byline && <div className="story-byline">{byline}</div>}
      </header>

      <article className="story-reading story-reading--panel">
        {story.caption && <p className="story-caption">{story.caption}</p>}
        <LayoutRenderer layout={(story as any).layout ?? []} />
      </article>
    </div>
  )
}
