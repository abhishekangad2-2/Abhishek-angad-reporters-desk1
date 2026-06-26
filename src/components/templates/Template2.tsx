import { Story } from '@/payload-types'
import Masthead from '@/components/Masthead'
import PlexusBackground from '@/components/PlexusBackground'
import { LayoutRenderer } from '@/components/LexicalRenderer'
import { bylineOf, sectionNameOf, heroUrlOf } from './storyMeta'

/** Z-Pattern design (x/y) at the story level: a hero row with image on one
 *  side and headline on the other, then the body on a translucent reading
 *  panel over a faint Plexus. */
export default function Template2({ story }: { story: Story }) {
  const heroUrl = heroUrlOf(story)
  const sectionName = sectionNameOf(story)
  const byline = bylineOf(story)

  return (
    <div className="story landing landing--z-pattern">
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={60}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={0.3}
      />
      <Masthead />

      <section className="z-row">
        <div
          className="z-row-image"
          style={heroUrl ? { backgroundImage: `url(${heroUrl})` } : undefined}
        />
        <div className="z-row-text">
          <span className="three-col-section">{sectionName}</span>
          <h2>{story.headline}</h2>
          {story.strap && <p>{story.strap}</p>}
          {byline && <div className="story-byline">{byline}</div>}
        </div>
      </section>

      <article className="story-reading story-reading--panel">
        {story.caption && <p className="story-caption">{story.caption}</p>}
        <LayoutRenderer layout={(story as any).layout ?? []} />
      </article>
    </div>
  )
}
