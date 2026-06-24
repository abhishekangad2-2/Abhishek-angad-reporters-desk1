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

function SinglePictureBlock({ block }: { block: any }) {
  const url = getUrl(block.image)
  if (!url) return null
  return (
    <figure className="my-8">
      <div className="relative w-full aspect-[16/9] overflow-hidden">
        <Image src={url} alt={block.caption ?? ''} fill className="object-cover" />
      </div>
      {block.caption && (
        <figcaption className="text-xs font-mono text-ink-soft mt-2">{block.caption}</figcaption>
      )}
    </figure>
  )
}

function TextPhotoBlock({ block }: { block: any }) {
  const url = getUrl(block.image)
  return (
    <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <div className="prose prose-lg font-serif">{block.text}</div>
      {url && (
        <figure>
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            <Image src={url} alt={block.caption ?? ''} fill className="object-cover" />
          </div>
          {block.caption && (
            <figcaption className="text-xs font-mono text-ink-soft mt-2">{block.caption}</figcaption>
          )}
        </figure>
      )}
    </div>
  )
}

function GalleryBlock({ block }: { block: any }) {
  const trackUrl = getUrl(block.track)
  return (
    <div className="my-8">
      {block.gallery?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {block.gallery.map((item: any, i: number) => {
            const url = getUrl(item.image)
            if (!url) return null
            return (
              <div key={i} className="relative aspect-square overflow-hidden">
                <Image src={url} alt="" fill className="object-cover" />
              </div>
            )
          })}
        </div>
      )}
      {trackUrl && (
        <div className="mt-4">
          {/* Render as video if it looks like a video, otherwise audio */}
          {/\.(mp4|webm|mov)$/i.test(trackUrl) ? (
            <video src={trackUrl} controls className="w-full rounded" />
          ) : (
            <audio src={trackUrl} controls className="w-full" />
          )}
        </div>
      )}
    </div>
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
          default:
            return null
        }
      })}
    </>
  )
}
