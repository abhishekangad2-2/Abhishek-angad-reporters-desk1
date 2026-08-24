'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  title?: string
  transcript?: string | null
  /** Pre-computed waveform peaks (0–1). When present the player renders the
   *  waveform instantly and streams the audio instead of downloading it all. */
  peaks?: number[] | null
  /** Total duration in seconds, for the initial timeline before metadata loads. */
  duration?: number | null
}

export function WavePlayer({ src, title, transcript, peaks, duration: initialDuration }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<any>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(initialDuration ?? 0)
  const [currentTime, setCurrentTime] = useState(0)
  const [ready, setReady] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let ws: any

    import('wavesurfer.js').then(({ default: WaveSurfer }) => {
      const hasPeaks = Array.isArray(peaks) && peaks.length > 0
      ws = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: 'var(--accent, #b43d2a)',
        progressColor: 'var(--ink, #14171c)',
        cursorColor: 'transparent',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 56,
        normalize: true,
        interact: false, // seeking handled explicitly below (reliable with streamed peaks)
        url: src,
        // With peaks + duration, wavesurfer renders the waveform immediately and
        // streams playback (range requests) instead of downloading the whole file.
        ...(hasPeaks ? { peaks: [peaks as number[]], duration: initialDuration ?? undefined } : {}),
      })

      // Peaks are already drawn — enable playback as soon as the media can play,
      // rather than waiting on a full decode.
      if (hasPeaks) setReady(true)

      ws.on('ready', (dur: number) => {
        setDuration(dur)
        setReady(true)
      })
      ws.on('audioprocess', (t: number) => setCurrentTime(t))
      // Fires on seek too (not just playback), so the time label tracks scrubbing.
      ws.on('timeupdate', (t: number) => setCurrentTime(t))
      ws.on('play', () => setPlaying(true))
      ws.on('pause', () => setPlaying(false))
      ws.on('finish', () => setPlaying(false))

      wsRef.current = ws
    })

    return () => {
      ws?.destroy()
    }
  }, [src])

  const toggle = () => wsRef.current?.playPause()
  const dragging = useRef(false)

  // Click / drag anywhere on the waveform to seek.
  const seekToClientX = (clientX: number) => {
    const el = containerRef.current
    const ws = wsRef.current
    if (!el || !ws) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const d = ws.getDuration?.() || duration || 0
    // setTime reliably moves the streamed MediaElement; seekTo did not.
    ws.setTime?.(ratio * d)
    setCurrentTime(ratio * d)
  }
  const onWavePointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    seekToClientX(e.clientX)
  }
  const onWavePointerMove = (e: React.PointerEvent) => {
    if (dragging.current) seekToClientX(e.clientX)
  }
  const endDrag = () => {
    dragging.current = false
  }

  // Jump the audio ±seconds (podcast-style skip).
  const skip = (delta: number) => {
    const ws = wsRef.current
    if (!ws) return
    const d = ws.getDuration?.() || duration || 0
    const t = Math.max(0, Math.min(d, (ws.getCurrentTime?.() || 0) + delta))
    ws.setTime?.(t)
    setCurrentTime(t)
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="wave-player">
      {title && <div className="wave-player__title">{title}</div>}
      <div className="wave-player__controls">
        <button
          onClick={() => skip(-15)}
          disabled={!ready}
          aria-label="Back 15 seconds"
          className="wave-player__skip"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4 5 10l6 6" /><path d="M5 10h9a5 5 0 0 1 0 10h-3" />
          </svg>
          <span className="wave-player__skip-n">15</span>
        </button>
        <button
          onClick={toggle}
          disabled={!ready}
          aria-label={playing ? 'Pause' : 'Play'}
          className="wave-player__btn"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <button
          onClick={() => skip(15)}
          disabled={!ready}
          aria-label="Forward 15 seconds"
          className="wave-player__skip"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 4 19 10l-6 6" /><path d="M19 10h-9a5 5 0 0 0 0 10h3" />
          </svg>
          <span className="wave-player__skip-n">15</span>
        </button>
        <div
          className="wave-player__wave"
          ref={containerRef}
          onPointerDown={onWavePointerDown}
          onPointerMove={onWavePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') skip(5)
            else if (e.key === 'ArrowLeft') skip(-5)
          }}
        />
        <span className="wave-player__time">
          {ready ? `${fmt(currentTime)} / ${fmt(duration)}` : '–:–'}
        </span>
      </div>
      {transcript && (
        <div className="wave-player__transcript-wrap">
          <button
            className="wave-player__transcript-toggle"
            onClick={() => setShowTranscript((v) => !v)}
          >
            {showTranscript ? 'Hide transcript' : 'Show transcript'}
          </button>
          {showTranscript && (
            <div className="wave-player__transcript">{transcript}</div>
          )}
        </div>
      )}
    </div>
  )
}
