import { Story } from '@/payload-types'
import Masthead from '@/components/Masthead'
import PlexusBackground from '@/components/LazyPlexus'
import { LayoutRenderer } from '@/components/LexicalRenderer'
import StoryHeader from '@/components/StoryHeader'

/** Three-Column design (z-axis) at the story level: the full-bleed Plexus is
 *  the backdrop; an NYT-style header (full-bleed hero image, or video-left /
 *  text-right when the hero is a video) leads into a translucent reading panel. */
export default function Template1({ story }: { story: Story }) {
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

      <StoryHeader story={story} />

      <article className="story-reading story-reading--panel">
        {story.caption && <p className="story-caption">{story.caption}</p>}
        <LayoutRenderer layout={(story as any).layout ?? []} />
      </article>
    </div>
  )
}
