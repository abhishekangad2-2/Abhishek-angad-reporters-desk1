'use client'

// Reader accessibility preferences (the spec's "accessibility gear"):
// animation intensity, Low-Power mode, disable-3D. Stored in localStorage,
// broadcast via a CustomEvent so every consumer (SimulationBackground, CSS
// via the data attribute) updates live without a reload.
//
// System-level prefers-reduced-motion stays handled where it always was (the
// sims' own check + the global CSS media query); these prefs are the reader's
// EXPLICIT choice layered on top.

import { useEffect, useState } from 'react'

export type MotionLevel = 'full' | 'subtle' | 'off'

export type ReaderPrefs = {
  motion: MotionLevel
  lowPower: boolean
  disable3d: boolean
}

export const DEFAULT_READER_PREFS: ReaderPrefs = {
  motion: 'full',
  lowPower: false,
  disable3d: false,
}

const STORAGE_KEY = 'rd-reader-prefs'
const EVENT = 'rd-reader-prefs-changed'

export function loadReaderPrefs(): ReaderPrefs {
  if (typeof window === 'undefined') return DEFAULT_READER_PREFS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_READER_PREFS
    const p = JSON.parse(raw)
    return {
      motion: p.motion === 'subtle' || p.motion === 'off' ? p.motion : 'full',
      lowPower: p.lowPower === true,
      disable3d: p.disable3d === true,
    }
  } catch {
    return DEFAULT_READER_PREFS
  }
}

/** Persist + broadcast + reflect onto <html data-rd-motion> for the CSS layer. */
export function saveReaderPrefs(prefs: ReaderPrefs): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* private mode — prefs still apply for this page life */
  }
  applyMotionAttr(prefs)
  window.dispatchEvent(new CustomEvent(EVENT, { detail: prefs }))
}

/** Mirror the motion level onto the root element so plain CSS can damp
 *  animations/transitions when the reader turns motion off. */
export function applyMotionAttr(prefs: ReaderPrefs): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.rdMotion = prefs.motion
  document.documentElement.dataset.rdLowPower = prefs.lowPower ? 'true' : 'false'
}

/** Hydration-safe live prefs: SSR/first paint uses defaults, then the stored
 *  prefs load on mount and every change (this tab or another) re-renders. */
export function useReaderPrefs(): ReaderPrefs {
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_READER_PREFS)

  useEffect(() => {
    setPrefs(loadReaderPrefs())
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<ReaderPrefs>).detail
      setPrefs(detail ?? loadReaderPrefs())
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPrefs(loadReaderPrefs())
    }
    window.addEventListener(EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT, onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return prefs
}
