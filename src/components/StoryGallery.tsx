'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type GalleryImage = {
  url: string
  width?: number | null
  height?: number | null
  caption?: string | null
  /** Optional attached clip surfaced as a small badge. */
  clipUrl?: string | null
  clipKind?: 'audio' | 'video' | null
}

/**
 * No-crop masonry gallery (CSS columns) at each photo's true aspect ratio,
 * with a full-screen lightbox: click to open, on-screen prev/next, ArrowLeft/
 * ArrowRight to navigate, Esc to close, and focus trapped inside the dialog.
 */
export default function StoryGallery({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  const close = useCallback(() => setOpen(false), [])
  const next = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length],
  )
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length],
  )

  const openAt = (i: number) => {
    lastFocused.current = document.activeElement as HTMLElement
    setIndex(i)
    setOpen(true)
  }

  // Keyboard + body-scroll lock + focus restore while the lightbox is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Tab') {
        // Trap focus within the dialog.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])',
        )
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Move focus into the dialog.
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
    })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      lastFocused.current?.focus?.()
    }
  }, [open, close, next, prev])

  if (!images.length) return null

  const current = images[index]

  return (
    <div className="rd-gallery">
      <div className="rd-gallery__grid">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            className="rd-gallery__item"
            onClick={() => openAt(i)}
            aria-label={img.caption ? `Open image: ${img.caption}` : `Open image ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.caption ?? ''}
              width={img.width ?? undefined}
              height={img.height ?? undefined}
              loading="lazy"
            />
            {img.clipKind && (
              <span className="rd-gallery__badge">
                {img.clipKind === 'video' ? '▶ Clip' : '♪ Audio'}
              </span>
            )}
            {img.caption && <span className="rd-gallery__cap">{img.caption}</span>}
          </button>
        ))}
      </div>

      {open && (
        <div
          className="rd-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          ref={dialogRef}
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <button
            type="button"
            className="rd-lightbox__close"
            onClick={close}
            aria-label="Close (Esc)"
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              type="button"
              className="rd-lightbox__btn rd-lightbox__btn--prev"
              onClick={prev}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          <div className="rd-lightbox__stage">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="rd-lightbox__img" src={current.url} alt={current.caption ?? ''} />
            {current.clipKind && current.clipUrl && (
              <div className="rd-gallery__track">
                {current.clipKind === 'video' ? (
                  <video
                    src={current.clipUrl}
                    controls
                    playsInline
                    style={{ maxWidth: '100%', maxHeight: '30vh' }}
                  />
                ) : (
                  <audio src={current.clipUrl} controls style={{ width: '100%' }} />
                )}
              </div>
            )}
            {current.caption && <p className="rd-lightbox__cap">{current.caption}</p>}
            {images.length > 1 && (
              <span className="rd-lightbox__count">
                {index + 1} / {images.length}
              </span>
            )}
          </div>

          {images.length > 1 && (
            <button
              type="button"
              className="rd-lightbox__btn rd-lightbox__btn--next"
              onClick={next}
              aria-label="Next image"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  )
}
