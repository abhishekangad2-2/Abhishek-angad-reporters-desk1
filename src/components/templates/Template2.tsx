import { Story } from '@/payload-types'
import Masthead from '@/components/Masthead'
import PlexusBackground from '@/components/LazyPlexus'
import { LayoutRenderer } from '@/components/LexicalRenderer'
import StoryHeader from '@/components/StoryHeader'

/** Z-Pattern design (x/y) at the story level: an NYT-style header (full-bleed
 *  hero image, or video-left / text-right when the hero is a video), then the
 *  body on a translucent reading panel over a faint Plexus. */
export default function Template2({ story }: { story: Story }) {
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

      <StoryHeader story={story} />

      <article className="story-reading story-reading--panel">
        {story.caption && <p className="story-caption">{story.caption}</p>}
        <LayoutRenderer layout={(story as any).layout ?? []} />
      </article>
    </div>
  )
}
