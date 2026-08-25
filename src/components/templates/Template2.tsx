import { Story } from '@/payload-types'
import Masthead from '@/components/Masthead'
import { LayoutRenderer } from '@/components/LexicalRenderer'
import StoryHeader from '@/components/StoryHeader'
import StoryEnd from '@/components/StoryEnd'
import StorySupport from '@/components/StorySupport'

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
        {/* Hero caption + credit now live under the hero image (StoryHeader). */}
        <LayoutRenderer layout={(story as any).layout ?? []} />
        <StoryEnd />
            <StorySupport />
      </article>
    </div>
  )
}
