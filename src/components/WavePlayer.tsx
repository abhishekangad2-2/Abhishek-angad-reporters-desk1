'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  title?: string
  transcript?: string | null
}

export function WavePlayer({ src, title, transcript }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<any>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [ready, setReady] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let ws: any

    import('wavesurfer.js').then(({ default: WaveSurfer }) => {
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
        url: src,
      })

      ws.on('ready', (dur: number) => {
        setDuration(dur)
        setReady(true)
      })
      ws.on('audioprocess', (t: number) => setCurrentTime(t))
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
        <div className="wave-player__wave" ref={containerRef} />
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
