import type { Story } from '@/payload-types'
import { bylineOf, sectionNameOf } from './templates/storyMeta'
import StoryVideo from './StoryVideo'
import { getChromeLabels, readLocale } from '@/lib/translate.server'
import './story.css'

/** Pull display details off a populated upload (hero media). */
function heroDetail(story: Story): {
  url: string | null
  width: number | null
  height: number | null
  mime: string
  id: any
  credit: string | null
  source: string | null
} {
  const h: any = story.heroMedia
  if (!h || typeof h !== 'object')
    return { url: null, width: null, height: null, mime: '', id: undefined, credit: null, source: null }
  return {
    url: h.url ?? null,
    width: h.width ?? null,
    height: h.height ?? null,
    mime: h.mimeType ?? '',
    id: h.id,
    credit: (h.credit ?? '').trim() || null,
    source: (h.source ?? '').trim() || null,
  }
}

function isVideo(mime: string, url: string | null): boolean {
  return mime.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(url ?? '')
}

function formatDate(story: Story): string | null {
  const pub = (story as any).publishedAt as string | undefined
  if (!pub) return null
  return new Date(pub).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** The headline / standfirst / byline block, server-rendered for SEO. */
function HeaderText({ story, byLabel }: { story: Story; byLabel: string }) {
  const sectionName = sectionNameOf(story)
  // Translate only the "By" prefix; the author's name stays as written.
  const byline = bylineOf(story).replace(/^By\b/, byLabel)
  const date = formatDate(story)
  return (
    <header className="rd-header">
      <p className="rd-header__kicker">{sectionName}</p>
      <h1 className="rd-header__headline">{story.headline}</h1>
      {story.strap && <p className="rd-header__standfirst">{story.strap}</p>}
      {(byline || date) && (
        <div className="rd-header__meta">
          {byline && <span className="rd-header__byline">{byline}</span>}
          {date && <span className="rd-header__date" suppressHydrationWarning>{date}</span>}
        </div>
      )}
    </header>
  )
}

/**
 * NYT-style story header. Server-rendered for SEO. When the hero media is a
 * VIDEO, renders an immersive video-left / text-right split hero on wide
 * screens; otherwise a full-bleed hero image (or no media).
 */
export default async function StoryHeader({ story }: { story: Story }) {
  const hero = heroDetail(story)
  const heroIsVideo = hero.url ? isVideo(hero.mime, hero.url) : false
  const byLabel = (await getChromeLabels(await readLocale())).by

  if (heroIsVideo && hero.url) {
    return (
      <div className="rd-hero-split">
        <div className="rd-hero-split__media">
          <StoryVideo
            trackId={hero.id}
            fallbackUrl={hero.url}
            width={hero.width}
            height={hero.height}
          />
        </div>
        <div className="rd-hero-split__text">
          <HeaderText story={story} byLabel={byLabel} />
        </div>
      </div>
    )
  }

  return (
    <>
      <HeaderText story={story} byLabel={byLabel} />
      {hero.url && (
        <figure className="rd-hero-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.url} alt={story.headline} />
          {(story.caption || hero.credit || hero.source) && (
            <figcaption className="rd-hero-cap">
              {story.caption && <strong className="rd-hero-cap__text">{story.caption}</strong>}
              {(hero.credit || hero.source) && (
                <span className="rd-hero-cap__credit">
                  {hero.credit ? `Photograph: ${hero.credit}` : ''}
                  {hero.credit && hero.source ? ' · ' : ''}
                  {hero.source ? `Source: ${hero.source}` : ''}
                </span>
              )}
            </figcaption>
          )}
        </figure>
      )}
    </>
  )
}
