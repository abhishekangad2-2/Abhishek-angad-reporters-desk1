import { Story } from '@/payload-types'
import Masthead from '@/components/Masthead'
import PlexusBackground from '@/components/PlexusBackground'
import { RichTextRenderer } from '@/components/LexicalRenderer'
import { sectionNameOf } from './storyMeta'

/** Immersive design (z-axis scrollytelling) at the story level: load-bearing
 *  Plexus behind full-bleed chapters that scroll over it. */
export default function Template4({ story }: { story: Story }) {
  const chapters = (story as any).scrollytellingChapters || []
  const sectionName = sectionNameOf(story)

  return (
    <div className="story landing landing--immersive">
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={120}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={0.5}
      />
      <Masthead />

      <header className="immersive-hero">
        <span className="three-col-section">{sectionName}</span>
        <h1>{story.headline}</h1>
        {story.strap && <p className="immersive-strap">{story.strap}</p>}
        {chapters.length > 0 && <span className="immersive-scrollcue">Scroll ↓</span>}
      </header>

      {chapters.length > 0 ? (
        chapters.map((chapter: any, index: number) => {
          const bgUrl =
            chapter.backgroundMedia &&
            typeof chapter.backgroundMedia === 'object' &&
            'url' in chapter.backgroundMedia
              ? chapter.backgroundMedia.url
              : null
          return (
            <section
              key={index}
              className="chapter"
              style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined}
            >
              <div className="chapter-text">
                {chapter.chapterTitle && <h2>{chapter.chapterTitle}</h2>}
                <RichTextRenderer content={chapter.content} />
              </div>
            </section>
          )
        })
      ) : (
        <section className="chapter">
          <div className="chapter-text">
            {story.caption && <p>{story.caption}</p>}
            <p>This story has no scrollytelling chapters yet.</p>
          </div>
        </section>
      )}
    </div>
  )
}
