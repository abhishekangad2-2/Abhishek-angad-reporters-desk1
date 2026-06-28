'use client'

import { useEffect, useRef, useState } from 'react'

// Public base of the media bucket. Transcoder writes HLS output to
// transcoded/<mediaId>/manifest.m3u8. Not secret — it's the bucket name.
const MEDIA_BASE = 'https://storage.googleapis.com/reportersdesk-media-secret-walker-497804-d5'

/**
 * Aspect-safe story video player.
 *
 * - Keeps the existing HLS / hls.js logic: plays the Cloud Transcoder HLS
 *   rendition when present, falls back to the original upload otherwise; native
 *   HLS on Safari, hls.js elsewhere.
 * - Portrait video STAYS portrait: contained, centered, capped at 85vh in a
 *   dark frame — never stretched to 16:9. Landscape fills the column at 16:9.
 *   Unknown dimensions use a safe contained default.
 * - Adds a fullscreen affordance and auto-pauses when scrolled out of view.
 */
export default function StoryVideo({
  trackId,
  fallbackUrl,
  poster,
  width,
  height,
}: {
  trackId?: string | number
  fallbackUrl: string
  poster?: string
  width?: number | null
  height?: number | null
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  // Orientation may be known from CMS dimensions, or measured on metadata load.
  const initialOrientation =
    width && height ? (height > width ? 'portrait' : 'landscape') : 'auto'
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>(
    initialOrientation,
  )

  // HLS wiring (mirrors HlsVideo).
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const manifest = trackId != null ? `${MEDIA_BASE}/transcoded/${trackId}/manifest.m3u8` : null
    let hls: any
    let cancelled = false
    const applyFallback = () => {
      if (!cancelled && video.src !== fallbackUrl) video.src = fallbackUrl
    }

    ;(async () => {
      if (!manifest) {
        video.src = fallbackUrl
        return
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = manifest
        video.addEventListener('error', applyFallback, { once: true })
        return
      }
      try {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true })
          hls.loadSource(manifest)
          hls.attachMedia(video)
          hls.on(Hls.Events.ERROR, (_evt: unknown, data: any) => {
            if (data?.fatal) {
              try {
                hls.destroy()
              } catch {}
              applyFallback()
            }
          })
        } else {
          applyFallback()
        }
      } catch {
        applyFallback()
      }
    })()

    return () => {
      cancelled = true
      if (hls) {
        try {
          hls.destroy()
        } catch {}
      }
    }
  }, [trackId, fallbackUrl])

  // Auto-pause when scrolled out of view.
  useEffect(() => {
    const video = videoRef.current
    const frame = frameRef.current
    if (!video || !frame || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && !video.paused) video.pause()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(frame)
    return () => io.disconnect()
  }, [])

  const onLoadedMetadata = () => {
    const v = videoRef.current
    if (!v || !v.videoWidth || !v.videoHeight) return
    if (orientation === 'auto') {
      setOrientation(v.videoHeight > v.videoWidth ? 'portrait' : 'landscape')
    }
  }

  const goFullscreen = () => {
    const el = videoRef.current as any
    if (!el) return
    if (el.requestFullscreen) el.requestFullscreen()
    else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen() // iOS Safari
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
  }

  return (
    <div
      ref={frameRef}
      className={`rd-video__frame rd-video__frame--${orientation}`}
    >
      <video
        ref={videoRef}
        controls
        playsInline
        poster={poster}
        onLoadedMetadata={onLoadedMetadata}
      />
      <button
        type="button"
        className="rd-video__fs"
        onClick={goFullscreen}
        aria-label="Fullscreen"
      >
        ⛶
      </button>
    </div>
  )
}
