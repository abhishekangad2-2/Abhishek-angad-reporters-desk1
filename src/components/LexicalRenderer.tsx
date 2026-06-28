/**
 * LexicalRenderer — renders Payload CMS Lexical rich text nodes to React elements.
 *
 * Supports the node types produced by the default Lexical editor:
 *  - paragraphs, headings (h1–h6)
 *  - lists (ordered / unordered)
 *  - blockquote
 *  - inline formatting: bold, italic, underline, strikethrough, code
 *  - links
 *  - line-breaks
 *
 * Also renders the custom Payload blocks inside a Story `layout` field:
 *  - Prose          → renders the richText content recursively
 *  - SinglePicture  → <figure> + optional caption
 *  - TextPhoto      → two-column text + image
 *  - GalleryAudioVideo → image grid + optional audio/video track
 */
import Image from 'next/image'
import React from 'react'
import { WavePlayer } from './WavePlayer'
import StoryGallery, { type GalleryImage } from './StoryGallery'
import StoryVideo from './StoryVideo'
import './story.css'

// ─────────────────────────── Lexical node renderer ───────────────────────────

function renderLexicalNode(node: any, key: string | number): React.ReactNode {
  if (!node) return null

  switch (node.type) {
    case 'root':
      return <>{node.children?.map((child: any, i: number) => renderLexicalNode(child, i))}</>

    case 'paragraph':
      if (!node.children?.length) return <br key={key} />
      return (
        <p key={key}>
          {node.children.map((child: any, i: number) => renderLexicalNode(child, i))}
        </p>
      )

    case 'heading': {
      const Tag = node.tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return (
        <Tag key={key}>
          {node.children?.map((child: any, i: number) => renderLexicalNode(child, i))}
        </Tag>
      )
    }

    case 'list': {
      const Tag = node.listType === 'number' ? 'ol' : 'ul'
      return (
        <Tag key={key}>
          {node.children?.map((child: any, i: number) => renderLexicalNode(child, i))}
        </Tag>
      )
    }

    case 'listitem':
      return (
        <li key={key}>
          {node.children?.map((child: any, i: number) => renderLexicalNode(child, i))}
        </li>
      )

    case 'quote':
      return (
        <blockquote key={key}>
          {node.children?.map((child: any, i: number) => renderLexicalNode(child, i))}
        </blockquote>
      )

    case 'link': {
      const href: string = node.fields?.url ?? node.url ?? '#'
      return (
        <a key={key} href={href} target={node.fields?.newTab ? '_blank' : undefined} rel="noopener noreferrer">
          {node.children?.map((child: any, i: number) => renderLexicalNode(child, i))}
        </a>
      )
    }

    case 'linebreak':
      return <br key={key} />

    case 'text': {
      let content: React.ReactNode = node.text
      // Payload stores formatting as a bitmask on `format`
      const fmt: number = node.format ?? 0
      if (fmt & 1)  content = <strong>{content}</strong>
      if (fmt & 2)  content = <em>{content}</em>
      if (fmt & 8)  content = <u>{content}</u>
      if (fmt & 4)  content = <s>{content}</s>
      if (fmt & 16) content = <code>{content}</code>
      return <React.Fragment key={key}>{content}</React.Fragment>
    }

    default:
      // Unknown node — render children if present, otherwise nothing
      if (node.children?.length) {
        return (
          <React.Fragment key={key}>
            {node.children.map((child: any, i: number) => renderLexicalNode(child, i))}
          </React.Fragment>
        )
      }
      return null
  }
}

// ────────────────────── Public: richText root renderer ───────────────────────

export function RichTextRenderer({ content }: { content: any }) {
  if (!content?.root) return null
  return <>{renderLexicalNode(content.root, 'root')}</>
}

// ─────────────────────────── Layout block renderer ───────────────────────────

function getUrl(media: any): string | null {
  if (!media) return null
  if (typeof media === 'string') return media
  return media.url ?? null
}

/** Pull display details (url + true dimensions + mime) off a populated upload. */
function mediaDetail(media: any): {
  url: string | null
  width: number | null
  height: number | null
  mime: string
  id: any
} {
  if (!media || typeof media !== 'object') {
    return { url: typeof media === 'string' ? media : null, width: null, height: null, mime: '', id: undefined }
  }
  return {
    url: media.url ?? null,
    width: media.width ?? null,
    height: media.height ?? null,
    mime: media.mimeType ?? '',
    id: media.id,
  }
}

function isVideoMedia(mime: string, url: string | null): boolean {
  return mime.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(url ?? '')
}

function SinglePictureBlock({ block }: { block: any }) {
  const { url, width, height } = mediaDetail(block.image)
  if (!url) return null
  return (
    <figure className="my-8">
      {/* True aspect ratio — no crop. */}
      <Image
        src={url}
        alt={block.caption ?? ''}
        width={width ?? 1600}
        height={height ?? 1000}
        sizes="(min-width: 720px) 720px, 100vw"
        className="w-full h-auto rounded"
      />
      {block.caption && (
        <figcaption className="text-xs font-mono text-ink-soft mt-2">{block.caption}</figcaption>
      )}
    </figure>
  )
}

function TextPhotoBlock({ block }: { block: any }) {
  const { url, width, height } = mediaDetail(block.image)
  return (
    <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div className="prose prose-lg font-serif">{block.text}</div>
      {url && (
        <figure>
          {/* True aspect ratio — no crop. */}
          <Image
            src={url}
            alt={block.caption ?? ''}
            width={width ?? 1200}
            height={height ?? 900}
            sizes="(min-width: 768px) 360px, 100vw"
            className="w-full h-auto rounded"
          />
          {block.caption && (
            <figcaption className="text-xs font-mono text-ink-soft mt-2">{block.caption}</figcaption>
          )}
        </figure>
      )}
    </div>
  )
}

function GalleryBlock({ block }: { block: any }) {
  const track: any = block.track
  const trackUrl = getUrl(track)
  const trackId = track && typeof track === 'object' ? track.id : undefined
  const trackMime: string = track && typeof track === 'object' ? (track.mimeType ?? '') : ''
  const trackIsVideo = isVideoMedia(trackMime, trackUrl)

  const images: GalleryImage[] = (block.gallery ?? [])
    .map((item: any) => {
      const d = mediaDetail(item.image)
      if (!d.url) return null
      return {
        url: d.url,
        width: d.width,
        height: d.height,
        caption: item.caption ?? null,
      } as GalleryImage
    })
    .filter(Boolean) as GalleryImage[]

  // Surface an attached gallery-level clip on the first image so it gets a
  // small badge + inline control in the lightbox.
  if (trackUrl && images.length) {
    images[0] = {
      ...images[0],
      clipUrl: trackUrl,
      clipKind: trackIsVideo ? 'video' : 'audio',
    }
  }

  return (
    <div className="my-8">
      {images.length > 0 && <StoryGallery images={images} />}
      {trackUrl && (
        <div className="rd-gallery__track">
          {trackIsVideo ? (
            <StoryVideo trackId={trackId} fallbackUrl={trackUrl} />
          ) : (
            <WavePlayer
              src={trackUrl}
              transcript={track && typeof track === 'object' ? (track.transcript ?? null) : null}
            />
          )}
        </div>
      )}
    </div>
  )
}

function FullBleedBlock({ block }: { block: any }) {
  const url = getUrl(block.image)
  if (!url) return null
  return (
    <figure className="vm-fullbleed">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={block.overlayText ?? ''} className="vm-fullbleed-img" />
      {block.overlayText && <figcaption className="vm-fullbleed-overlay">{block.overlayText}</figcaption>}
      {block.credit && <span className="vm-credit">{block.credit}</span>}
    </figure>
  )
}

function ComparisonBlock({ block }: { block: any }) {
  const a = getUrl(block.beforeImage)
  const b = getUrl(block.afterImage)
  if (!a || !b) return null
  return (
    <figure className="vm-compare">
      <div className="vm-compare-grid">
        <div className="vm-compare-cell">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a} alt={block.beforeLabel ?? 'Before'} />
          <span className="vm-tag">{block.beforeLabel || 'Before'}</span>
        </div>
        <div className="vm-compare-cell">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b} alt={block.afterLabel ?? 'After'} />
          <span className="vm-tag">{block.afterLabel || 'After'}</span>
        </div>
      </div>
      {block.caption && <figcaption className="vm-cap">{block.caption}</figcaption>}
    </figure>
  )
}

function PullQuoteBlk({ block }: { block: any }) {
  if (!block.quote) return null
  return (
    <blockquote className="vm-pullquote">
      <p>{block.quote}</p>
      {block.attribution && <cite className="vm-pullquote-cite">{block.attribution}</cite>}
    </blockquote>
  )
}

function DiptychBlk({ block }: { block: any }) {
  const l = getUrl(block.leftImage)
  const r = getUrl(block.rightImage)
  return (
    <figure className="vm-diptych">
      <div className="vm-diptych-grid">
        {l && (
          <div className="vm-diptych-cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l} alt={block.leftCaption ?? ''} />
            {block.leftCaption && <figcaption className="vm-cap">{block.leftCaption}</figcaption>}
          </div>
        )}
        {r && (
          <div className="vm-diptych-cell">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={r} alt={block.rightCaption ?? ''} />
            {block.rightCaption && <figcaption className="vm-cap">{block.rightCaption}</figcaption>}
          </div>
        )}
      </div>
    </figure>
  )
}

// Normalise a pasted YouTube/Vimeo link to a privacy-friendly embed URL.
// Handles watch?v=, youtu.be/, /embed/, and /shorts/ (portrait). Returns a
// portrait flag so Shorts/vertical clips render 9:16 instead of 16:9.
function toEmbed(url: string): { src: string; portrait: boolean } {
  const short = url.match(/youtube\.com\/shorts\/([\w-]+)/)
  if (short) return { src: `https://www.youtube-nocookie.com/embed/${short[1]}`, portrait: true }
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([\w-]+)/)
  if (yt) return { src: `https://www.youtube-nocookie.com/embed/${yt[1]}`, portrait: false }
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return { src: `https://player.vimeo.com/video/${vm[1]}`, portrait: false }
  return { src: url, portrait: false }
}

function VideoBlock({ block }: { block: any }) {
  const { url: fileUrl, width, height, id: fileId } = mediaDetail(block.videoFile)
  return (
    <figure className="rd-video">
      {fileUrl ? (
        // Portrait stays portrait (contained, ≤85vh, dark frame); landscape
        // fills 16:9. Keeps the HLS/hls.js logic + adds fullscreen + auto-pause.
        <StoryVideo trackId={fileId} fallbackUrl={fileUrl} width={width} height={height} />
      ) : block.embedUrl ? (
        (() => {
          const { src, portrait } = toEmbed(block.embedUrl)
          return (
            <div className={`rd-embed${portrait ? ' rd-embed--portrait' : ''}`}>
              <iframe
                src={src}
                title={block.caption ?? 'Video'}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                loading="lazy"
              />
            </div>
          )
        })()
      ) : null}
      {block.caption && <figcaption className="rd-video__cap">{block.caption}</figcaption>}
    </figure>
  )
}

function AudioBlock({ block }: { block: any }) {
  const url = getUrl(block.audioFile)
  if (!url) return null
  const transcript = block.audioFile && typeof block.audioFile === 'object'
    ? (block.audioFile.transcript ?? null)
    : null
  return (
    <figure className="vm-audio">
      <WavePlayer src={url} title={block.title} transcript={transcript} />
      {block.caption && <figcaption className="vm-cap">{block.caption}</figcaption>}
    </figure>
  )
}

function StatBlock({ block }: { block: any }) {
  if (!Array.isArray(block.stats) || block.stats.length === 0) return null
  return (
    <div className="vm-stats">
      {block.intro && <p className="vm-stats-intro">{block.intro}</p>}
      <div className="vm-stats-grid">
        {block.stats.map((s: any, i: number) => (
          <div key={i} className="vm-stat">
            <span className="vm-stat-value">{s.value}</span>
            <span className="vm-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RedactedDocBlock({ block }: { block: any }) {
  const url = getUrl(block.documentImage)
  if (!url) return null
  return (
    <figure className="vm-doc">
      <div className="vm-doc-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={block.caption ?? 'Source document'} />
        <span className="vm-doc-stamp">{block.sourceLabel || 'Source document'}</span>
      </div>
      {block.caption && <figcaption className="vm-cap">{block.caption}</figcaption>}
    </figure>
  )
}

function TimelineRenderBlock({ block }: { block: any }) {
  if (!Array.isArray(block.entries) || block.entries.length === 0) return null
  return (
    <ol className="vm-timeline">
      {block.entries.map((e: any, i: number) => (
        <li key={i} className="vm-timeline-item">
          <span className="vm-timeline-date">{e.date}</span>
          <div className="vm-timeline-body">
            <span className="vm-timeline-title">{e.title}</span>
            {e.detail && <p className="vm-timeline-detail">{e.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

// ────────────────────────────── Main export ──────────────────────────────────

/**
 * Renders a Payload `layout` field (blocks array) for a Story document.
 * Pass the full `layout` array from the story data.
 */
export function LayoutRenderer({ layout }: { layout: any[] }) {
  if (!layout?.length) return null

  return (
    <>
      {layout.map((block: any, i: number) => {
        switch (block.blockType) {
          case 'Prose':
            return (
              <div key={i} className="prose prose-lg max-w-none font-serif leading-relaxed">
                <RichTextRenderer content={block.content} />
              </div>
            )
          case 'SinglePicture':
            return <SinglePictureBlock key={i} block={block} />
          case 'TextPhoto':
            return <TextPhotoBlock key={i} block={block} />
          case 'GalleryAudioVideo':
            return <GalleryBlock key={i} block={block} />
          case 'FullBleedImage':
            return <FullBleedBlock key={i} block={block} />
          case 'ImageComparison':
            return <ComparisonBlock key={i} block={block} />
          case 'PullQuote':
            return <PullQuoteBlk key={i} block={block} />
          case 'Diptych':
            return <DiptychBlk key={i} block={block} />
          case 'VideoEmbed':
            return <VideoBlock key={i} block={block} />
          case 'AudioClip':
            return <AudioBlock key={i} block={block} />
          case 'StatHighlight':
            return <StatBlock key={i} block={block} />
          case 'RedactedDocument':
            return <RedactedDocBlock key={i} block={block} />
          case 'Timeline':
            return <TimelineRenderBlock key={i} block={block} />
          default:
            return null
        }
      })}
    </>
  )
}
