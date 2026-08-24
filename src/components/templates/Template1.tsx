import { Story } from '@/payload-types'
import Masthead from '@/components/Masthead'
import { LayoutRenderer } from '@/components/LexicalRenderer'
import StoryHeader from '@/components/StoryHeader'
import StoryEnd from '@/components/StoryEnd'

/** Three-Column design (z-axis) at the story level: an NYT-style header
 *  (full-bleed hero image, or video-left / text-right when the hero is a
 *  video) leads into the shared reading column. The plexus backdrop was
 *  removed — it read as a stray web behind the text and differed in strength
 *  from the other templates, breaking article-to-article uniformity. */
export default function Template1({ story }: { story: Story }) {
  return (
    <div className="story landing landing--three-column">
      <Masthead />

      <StoryHeader story={story} />

      <article className="story-reading story-reading--panel">
        {/* Hero caption + credit now live under the hero image (StoryHeader). */}
        <LayoutRenderer layout={(story as any).layout ?? []} />
        <StoryEnd />
      </article>
    </div>
  )
}
