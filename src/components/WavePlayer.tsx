'use client'

import { useState } from 'react'
import AudioPlayer from 'react-h5-audio-player'
import 'react-h5-audio-player/lib/styles.css'

type Props = {
  src: string
  title?: string
  transcript?: string | null
  /** Accepted for backward-compat with existing callers (podcast page passes
   *  pre-computed peaks/duration). The h5 player renders its own progress bar
   *  and streams via the native media element, so these are not used here. */
  peaks?: number[] | null
  duration?: number | null
}

// Inline SVG transport icons. react-h5-audio-player's default icons are drawn
// by @iconify/react, which fetches icon data from api.iconify.design at runtime
// — a call our enforced CSP (connect-src) correctly blocks, leaving the buttons
// empty. Supplying our own inline SVGs sidesteps that network dependency
// entirely (and matches the previous player's iconography).
const icons = {
  play: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  rewind: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4 5 10l6 6" />
      <path d="M5 10h9a5 5 0 0 1 0 10h-3" />
      <text x="11.5" y="19" fontSize="7" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="sans-serif">15</text>
    </svg>
  ),
  forward: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 4 19 10l-6 6" />
      <path d="M19 10h-9a5 5 0 0 0 0 10h3" />
      <text x="12.5" y="19" fontSize="7" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="sans-serif">15</text>
    </svg>
  ),
  volume: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a4 4 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  volumeMute: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M22 9l-6 6M16 9l6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

// Podcast / in-article audio player. Backed by react-h5-audio-player: a
// conventional, accessible player (play/pause, ±15s jump, progress, volume)
// styled to the ReportersDesk brand via the .rhap_* overrides in globals.css.
// Keeps the same props/name as the previous wavesurfer implementation so all
// call sites are unchanged. Transcript toggle is preserved below the player.
export function WavePlayer({ src, title, transcript }: Props) {
  const [showTranscript, setShowTranscript] = useState(false)

  return (
    <div className="wave-player">
      {title && <div className="wave-player__title">{title}</div>}

      <AudioPlayer
        src={src}
        // Don't pull the whole file until the reader presses play.
        preload="none"
        // ±15s skip, matching the previous player.
        showJumpControls
        progressJumpSteps={{ backward: 15000, forward: 15000 }}
        // Drop the loop toggle — not meaningful for long-form audio.
        customAdditionalControls={[]}
        showDownloadProgress
        // Inline SVGs so icons render without @iconify's blocked network fetch.
        customIcons={icons}
        // Accessible labels for the transport controls.
        i18nAriaLabels={{
          play: 'Play',
          pause: 'Pause',
          rewind: 'Back 15 seconds',
          forward: 'Forward 15 seconds',
        }}
      />

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
