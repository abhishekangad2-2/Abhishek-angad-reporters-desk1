import { Story } from '@/payload-types'
import { LayoutRenderer } from '@/components/LexicalRenderer'
import { bylineOf, sectionNameOf, heroUrlOf } from './storyMeta'

/** Newspaper design (broadsheet) at the story level: print masthead band, then
 *  the drop-cap body in the shared reading column with the details rail stacked
 *  below. The Plexus watermark was removed and the grid collapsed to one column
 *  so this article flows identically to the other templates. */
export default function Template3({ story }: { story: Story }) {
  const heroUrl = heroUrlOf(story)
  const sectionName = sectionNameOf(story)
  const byline = bylineOf(story)
  const pub = (story as any).publishedAt as string | undefined
  const longDate = (pub ? new Date(pub) : new Date()).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="story landing landing--newspaper">
      <div className="newspaper-masthead-band">
        <div className="news-masthead-inner">
          <div className="news-wordmark">Reporters Desk</div>
          <div className="news-date" suppressHydrationWarning>{longDate}</div>
        </div>
      </div>

      <div className="newspaper-grid">
        <article className="newspaper-lead">
          <div className="newspaper-section">{sectionName}</div>
          <h1>{story.headline}</h1>
          {story.strap && <p className="news-strap">{story.strap}</p>}

          <div className="news-byrule">
            <span>{byline || 'Staff report'}</span>
            {pub && <span suppressHydrationWarning>{new Date(pub).toLocaleDateString('en-IN')}</span>}
          </div>

          {heroUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="newspaper-lead-img" src={heroUrl} alt={story.headline} />
          )}

          <div className="news-body newspaper-dropcap">
            {story.caption && <p className="story-caption">{story.caption}</p>}
            <LayoutRenderer layout={(story as any).layout ?? []} />
          </div>
        </article>

        <aside className="newspaper-secondary" aria-labelledby="np-key-details">
          <h2 id="np-key-details" className="newspaper-aside-h">Key details</h2>
          <ul className="news-keylist">
            <li>Section — {sectionName}</li>
            {Array.isArray((story as any).issueTags) &&
              (story as any).issueTags.map((tag: any, i: number) => {
                const label = typeof tag === 'object' && tag !== null ? tag.title : tag
                const key = typeof tag === 'object' && tag !== null ? (tag.id ?? i) : tag
                if (!label) return null
                return <li key={key}>{label}</li>
              })}
          </ul>
        </aside>

        <aside className="newspaper-briefs" aria-labelledby="np-have-tip">
          <h2 id="np-have-tip" className="newspaper-aside-h">Have a tip?</h2>
          <a className="news-tip" href="mailto:tips@reportersdesk.abhishekangad.com">
            Contact us securely →
          </a>
        </aside>
      </div>
    </div>
  )
}
