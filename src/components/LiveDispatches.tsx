'use client'

import { useEffect, useState } from 'react'
import type { Dispatch } from '../../lib/types'

export function ShareButton({ text, url }: { text: string; url?: string }) {
  async function handleShare() {
    const shareUrl = url ?? window.location.href
    if (navigator.share) {
      await navigator.share({ text, url: shareUrl })
    } else {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`)
    }
  }

  return (
    <button className="share-button" onClick={handleShare} aria-label="Share this dispatch">
      Share
    </button>
  )
}

export default function LiveDispatchesWidget() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/live-dispatches/recent')
      .then((r) => r.json())
      .then(setDispatches)
      .catch(() => setDispatches([]))
  }, [])

  if (dispatches.length === 0) return null

  return (
    <div className={`dispatch-widget ${open ? 'dispatch-widget--open' : ''}`}>
      <button className="dispatch-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="dispatch-pulse" aria-hidden /> Live Dispatches
      </button>
      {open && (
        <ul className="dispatch-list">
          {dispatches.map((d) => (
            <li key={d.id} className="dispatch-item">
              <span className="dispatch-initials" title={d.journalist.name}>
                {d.journalist.initials}
              </span>
              <p className="dispatch-text">{d.text}</p>
              <ShareButton text={d.text} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
