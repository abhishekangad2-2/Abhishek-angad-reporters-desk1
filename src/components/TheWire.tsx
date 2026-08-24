'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

type Dispatch = {
  id: string
  initials: string
  text: string
  flag: string // '' | 'Significant' | 'Breaking'
  significance: string
  reactions: number
  time: string
}

const REACTED_KEY = 'rd_wire_reacted'

function loadReacted(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(REACTED_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

/** The Wire — live dispatch feed as an X-style mini-microblog. Used both as a
 *  homepage section (compact, links into /wire) and as the full /wire page. */
export default function TheWire({
  limit = 5,
  full = false,
}: {
  limit?: number
  full?: boolean
}) {
  const [items, setItems] = useState<Dispatch[]>([])
  const [reacted, setReacted] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/dispatches?limit=${limit}`, { cache: 'no-store' })
      const json = await res.json()
      setItems(Array.isArray(json.dispatches) ? json.dispatches : [])
    } catch {
      /* keep last */
    } finally {
      setLoaded(true)
    }
  }, [limit])

  useEffect(() => {
    setReacted(loadReacted())
    fetchItems()
    timer.current = setInterval(fetchItems, 20000) // live-ish poll
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [fetchItems])

  const react = async (id: string) => {
    if (reacted.has(id)) return
    // optimistic
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, reactions: d.reactions + 1 } : d)))
    const next = new Set(reacted)
    next.add(id)
    setReacted(next)
    try {
      localStorage.setItem(REACTED_KEY, JSON.stringify([...next]))
    } catch {
      /* ignore */
    }
    try {
      await fetch(`/api/dispatches/${id}/react`, { method: 'POST' })
    } catch {
      /* count already shown optimistically */
    }
  }

  return (
    <section className={`wire ${full ? 'wire--full' : ''}`} id="wire" aria-label="The Wire — live dispatches">
      <div className="wire-head">
        <span className="wire-title">
          <span className="wire-dot" aria-hidden /> The Wire · Live
        </span>
        {!full && (
          <Link className="wire-all" href="/wire">
            View the full wire →
          </Link>
        )}
      </div>

      <div className="wire-feed">
        {loaded && items.length === 0 && <p className="wire-empty">No dispatches yet.</p>}
        {items.map((d) => (
          <article className="wpost" key={d.id}>
            <div className="wpost-top">
              <span className="wpost-av">{d.initials}</span>
              <span className="wpost-who">
                <span className="wpost-h">@reportersdesk</span>
                <span className="wpost-t">· {d.time}</span>
              </span>
              {d.flag && (
                <span className={`wpost-flag ${d.significance === 'breaking' ? 'br' : 'sig'}`}>{d.flag}</span>
              )}
            </div>
            <p className="wpost-body">{d.text}</p>
            <div className="wpost-acts">
              <button
                className={`wpost-react ${reacted.has(d.id) ? 'on' : ''}`}
                onClick={() => react(d.id)}
                aria-pressed={reacted.has(d.id)}
              >
                ♥ {d.reactions > 0 ? d.reactions : ''}
              </button>
              {full && (
                <a
                  className="wpost-share"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(d.text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ↗ Share
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
