'use client'

// The spec's reader-facing "accessibility gear": animation intensity
// (Full / Subtle / Off), Low-Power mode, and Disable 3D. Floats above the
// language switcher (bottom-right); Live Dispatches owns bottom-left.
// Prefs persist in localStorage and apply live via readerPrefs' broadcast —
// SimulationBackground damps/kills the WebGL layer, and the
// [data-rd-motion="off"] CSS damps DOM animations.

import { useEffect, useRef, useState } from 'react'
import {
  applyMotionAttr,
  loadReaderPrefs,
  saveReaderPrefs,
  useReaderPrefs,
  type MotionLevel,
} from '@/lib/readerPrefs'

const MOTION_CHOICES: { value: MotionLevel; label: string; blurb: string }[] = [
  { value: 'full', label: 'Full', blurb: 'All motion and 3D effects' },
  { value: 'subtle', label: 'Subtle', blurb: 'Slower, dimmer background' },
  { value: 'off', label: 'Off', blurb: 'No animation at all' },
]

export default function ReaderSettings() {
  const prefs = useReaderPrefs()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMounted(true)
    // Reflect stored prefs onto <html> on first load (returning readers).
    applyMotionAttr(loadReaderPrefs())
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [open])

  if (!mounted) return null

  const update = (patch: Partial<typeof prefs>) => saveReaderPrefs({ ...prefs, ...patch })

  return (
    <div className="a11y-widget" ref={panelRef}>
      {open && (
        <div className="a11y-panel" role="dialog" aria-label="Motion and accessibility settings">
          <div className="a11y-panel-title">Reading comfort</div>

          <div className="a11y-group" role="radiogroup" aria-label="Animation intensity">
            <div className="a11y-group-label">Animation</div>
            {MOTION_CHOICES.map((c) => (
              <label key={c.value} className="a11y-option">
                <input
                  type="radio"
                  name="rd-motion"
                  value={c.value}
                  checked={prefs.motion === c.value}
                  onChange={() => update({ motion: c.value })}
                />
                <span>
                  <strong>{c.label}</strong>
                  <em>{c.blurb}</em>
                </span>
              </label>
            ))}
          </div>

          <label className="a11y-option a11y-option--switch">
            <input
              type="checkbox"
              checked={prefs.lowPower}
              onChange={(e) => update({ lowPower: e.target.checked })}
            />
            <span>
              <strong>Low-Power mode</strong>
              <em>Fewer particles, slower motion — saves battery</em>
            </span>
          </label>

          <label className="a11y-option a11y-option--switch">
            <input
              type="checkbox"
              checked={prefs.disable3d}
              onChange={(e) => update({ disable3d: e.target.checked })}
            />
            <span>
              <strong>Disable 3D backgrounds</strong>
              <em>Plain page, no WebGL</em>
            </span>
          </label>
        </div>
      )}

      <button
        type="button"
        className="a11y-toggle"
        aria-label="Motion and accessibility settings"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">⚙</span>
        <span className="a11y-toggle-label">Motion</span>
      </button>
    </div>
  )
}
