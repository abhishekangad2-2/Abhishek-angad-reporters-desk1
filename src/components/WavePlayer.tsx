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
