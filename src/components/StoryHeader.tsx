import type { Story } from '@/payload-types'
import { bylineOf, sectionNameOf } from './templates/storyMeta'
import StoryVideo from './StoryVideo'
import './story.css'

/** Pull display details off a populated upload (hero media). */
function heroDetail(story: Story): {
  url: string | null
  width: number | null
  height: number | null
  mime: string
  id: any
} {
  const h: any = story.heroMedia
  if (!h || typeof h !== 'object') return { url: null, width: null, height: null, mime: '', id: undefined }
  return {
    url: h.url ?? null,
    width: h.width ?? null,
    height: h.height ?? null,
    mime: h.mimeType ?? '',
    id: h.id,
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
function HeaderText({ story }: { story: Story }) {
  const sectionName = sectionNameOf(story)
  const byline = bylineOf(story)
  const date = formatDate(story)
  return (
    <header className="rd-header">
      <p className="rd-header__kicker">{sectionName}</p>
      <h1 className="rd-header__headline">{story.headline}</h1>
      {story.strap && <p className="rd-header__standfirst">{story.strap}</p>}
      {(byline || date) && (
        <div className="rd-header__meta">
          {byline && <span className="rd-header__byline">{byline}</span>}
          {date && <span className="rd-header__date">{date}</span>}
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
export default function StoryHeader({ story }: { story: Story }) {
  const hero = heroDetail(story)
  const heroIsVideo = hero.url ? isVideo(hero.mime, hero.url) : false

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
          <HeaderText story={story} />
        </div>
      </div>
    )
  }

  return (
    <>
      <HeaderText story={story} />
      {hero.url && (
        <figure className="rd-hero-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.url} alt={story.headline} />
          {story.caption && <figcaption>{story.caption}</figcaption>}
        </figure>
      )}
    </>
  )
}
