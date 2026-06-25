'use client'

import { useEffect, useRef } from 'react'

// Public base of the media bucket (objects are public-read). Transcoder writes
// HLS output to transcoded/<mediaId>/manifest.m3u8. Not secret — it's the
// bucket name — so it's safe to inline here.
const MEDIA_BASE = 'https://storage.googleapis.com/reportersdesk-media-secret-walker-497804-d5'

/**
 * Plays a Cloud Transcoder HLS rendition when it exists, and gracefully falls
 * back to the original uploaded file while a transcode is still running (or if
 * one was never produced). Uses native HLS on Safari, hls.js elsewhere.
 */
export default function HlsVideo({
  trackId,
  fallbackUrl,
  poster,
}: {
  trackId?: string | number
  fallbackUrl: string
  poster?: string
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const manifest = trackId != null ? `${MEDIA_BASE}/transcoded/${trackId}/manifest.m3u8` : null
    let hls: any
    let cancelled = false
    const useFallback = () => {
      if (!cancelled && video.src !== fallbackUrl) video.src = fallbackUrl
    }

    ;(async () => {
      if (!manifest) {
        video.src = fallbackUrl
        return
      }
      // Safari / iOS play HLS natively.
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = manifest
        video.addEventListener('error', useFallback, { once: true })
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
              try { hls.destroy() } catch {}
              useFallback()
            }
          })
        } else {
          useFallback()
        }
      } catch {
        useFallback()
      }
    })()

    return () => {
      cancelled = true
      if (hls) { try { hls.destroy() } catch {} }
    }
  }, [trackId, fallbackUrl])

  return <video ref={ref} controls playsInline poster={poster} className="w-full rounded" />
}
