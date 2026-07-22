import { Story } from '@/payload-types'
import Masthead from '@/components/Masthead'
import { LayoutRenderer } from '@/components/LexicalRenderer'
import StoryHeader from '@/components/StoryHeader'

/** Z-Pattern design (x/y) at the story level: an NYT-style header (full-bleed
 *  hero image, or video-left / text-right when the hero is a video), then the
 *  body in the shared reading column. The faint Plexus backdrop was removed so
 *  every article sits on the same clean paper. */
export default function Template2({ story }: { story: Story }) {
  return (
    <div className="story landing landing--z-pattern">
      <Masthead />

      <StoryHeader story={story} />

      <article className="story-reading story-reading--panel">
        {story.caption && <p className="story-caption">{story.caption}</p>}
        <LayoutRenderer layout={(story as any).layout ?? []} />
      </article>
    </div>
  )
}
