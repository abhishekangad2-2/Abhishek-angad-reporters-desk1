'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

// IDPB — Intelligent Dispatch & Patronage Beacon.
// Floating, collapsible "Live Dispatches" panel anchored bottom-right on all
// public pages. Realtime via SSE (/api/dispatches/stream) with polling fallback
// (/api/dispatches); Plexus-Pulse on Significant/Breaking; per-dispatch share;
// a notification-frequency control; and a Patronage Beacon that triggers on
// genuine engagement (dwell + scroll depth) with a per-story cooldown.

type Dispatch = {
  id: string | number
  initials: string
  text: string
  flag: '' | 'Significant' | 'Breaking' | string
  postedAt?: string
  time: string
}

type Freq = 'all' | 'breaking' | 'off'

const SITE_URL = 'https://reportersdesk.abhishekangad.com'
const POLL_MS = 20_000
const COOLDOWN_MS = 36 * 60 * 60 * 1000 // 36h, within the spec's 24–48h
const DWELL_MS = 45_000
const SCROLL_TRIGGER = 0.55

export default function LiveDispatches() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true)
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [showBeacon, setShowBeacon] = useState(false)
  const [payAmount, setPayAmount] = useState<number | null>(null)
  const [freq, setFreq] = useState<Freq>('all')
  const [menuOpen, setMenuOpen] = useState(false)

  // Restore the reader's notification preference.
  useEffect(() => {
    try {
      const f = localStorage.getItem('rd-disp-freq') as Freq | null
      if (f === 'all' || f === 'breaking' || f === 'off') setFreq(f)
    } catch {}
  }, [])
  const setFrequency = (f: Freq) => {
    setFreq(f)
    setMenuOpen(false)
    try {
      localStorage.setItem('rd-disp-freq', f)
    } catch {}
  }

  const fetchDispatches = useCallback(async () => {
    try {
      const res = await fetch('/api/dispatches', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data?.dispatches)) setDispatches(data.dispatches)
    } catch {}
  }, [])

  // Realtime via SSE; fall back to polling if the stream is unavailable.
  useEffect(() => {
    let es: EventSource | null = null
    let pollId: ReturnType<typeof setInterval> | null = null
    const startPolling = () => {
      fetchDispatches()
      pollId = setInterval(fetchDispatches, POLL_MS)
    }
    try {
      es = new EventSource('/api/dispatches/stream')
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (Array.isArray(data?.dispatches)) setDispatches(data.dispatches)
        } catch {}
      }
      es.onerror = () => {
        es?.close()
        es = null
        if (!pollId) startPolling()
      }
    } catch {
      startPolling()
    }
    return () => {
      es?.close()
      if (pollId) clearInterval(pollId)
    }
  }, [fetchDispatches])

  // Patronage Beacon — triggers on real engagement (dwell ≥45s AND scroll
  // depth ≥55%), once per story within the cooldown window.
  useEffect(() => {
    if (freq === 'off') return
    const key = `rd-beacon-${pathname}`
    try {
      const last = Number(localStorage.getItem(key) || 0)
      if (Date.now() - last < COOLDOWN_MS) return
    } catch {}
    const start = Date.now()
    let maxScroll = 0
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight
      if (h > 0) maxScroll = Math.max(maxScroll, scrollY / h)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const id = setInterval(() => {
      if (Date.now() - start >= DWELL_MS && maxScroll >= SCROLL_TRIGGER) {
        setShowBeacon(true)
        try {
          localStorage.setItem(key, String(Date.now()))
        } catch {}
        clearInterval(id)
        window.removeEventListener('scroll', onScroll)
      }
    }, 3000)
    return () => {
      clearInterval(id)
      window.removeEventListener('scroll', onScroll)
    }
  }, [pathname, freq])

  useEffect(() => {
    if (payAmount == null) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPayAmount(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [payAmount])

  if (freq === 'off') return null
  const visible = freq === 'breaking' ? dispatches.filter((d) => d.flag) : dispatches
  if (visible.length === 0) return null

  const upiLink =
    payAmount != null
      ? `upi://pay?pa=reportersdesk@upi&pn=ReportersDesk&am=${payAmount}&cu=INR&tn=Patronage`
      : ''

  return (
    <>
      <div
        className={`rd-dispatch ${collapsed ? 'collapsed' : ''}`}
        role="region"
        aria-label="Live Dispatches"
      >
        <div className="rd-dispatch-head">
          <span className="rd-dispatch-title">
            <span className="rd-live-dot" aria-hidden />
            Live Dispatches
          </span>
          <span style={{ position: 'relative', display: 'inline-flex', gap: 6 }}>
            <button
              type="button"
              className="rd-dispatch-toggle"
              aria-label="Notification settings"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((m) => !m)}
            >
              <span aria-hidden="true">⚙</span>
            </button>
            <button
              type="button"
              className="rd-dispatch-toggle"
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand live dispatches' : 'Collapse live dispatches'}
              onClick={() => setCollapsed((c) => !c)}
            >
              <span aria-hidden="true">{collapsed ? '▴' : '▾'}</span>
            </button>
            {menuOpen && (
              <div
                role="menu"
                aria-label="Notification frequency"
                style={{
                  position: 'absolute',
                  top: 26,
                  right: 0,
                  background: '#14171c',
                  border: '1px solid rgba(245,243,236,0.14)',
                  borderRadius: 6,
                  padding: 4,
                  zIndex: 60,
                  minWidth: 130,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.62rem',
                }}
              >
                {(['all', 'breaking', 'off'] as Freq[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="menuitemradio"
                    aria-checked={freq === f}
                    onClick={() => setFrequency(f)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: freq === f ? 'rgba(180,61,42,0.18)' : 'none',
                      color: freq === f ? '#e6b8ac' : '#cfcabd',
                      border: 'none',
                      padding: '0.45rem 0.6rem',
                      borderRadius: 4,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {f === 'all' ? 'All updates' : f === 'breaking' ? 'Only breaking' : 'Off'}
                  </button>
                ))}
              </div>
            )}
          </span>
        </div>

        <div className="rd-dispatch-body" aria-live="polite">
          {visible.map((d) => {
            const isPulse = d.flag === 'Significant' || d.flag === 'Breaking'
            const share = encodeURIComponent(d.text)
            return (
              <div key={d.id} className={`rd-disp ${isPulse ? 'pulse' : ''}`}>
                <div className="rd-disp-meta">
                  <span className="rd-disp-initials">{d.initials}</span>
                  <span className="rd-disp-time">{d.time}</span>
                  {d.flag ? <span className="rd-disp-flag">{d.flag}</span> : null}
                </div>
                <div className="rd-disp-text">{d.text}</div>
                <div className="rd-disp-share">
                  <a href={`https://twitter.com/intent/tweet?text=${share}`} target="_blank" rel="noopener noreferrer">Twitter</a>
                  <a href={`https://wa.me/?text=${share}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
                </div>
              </div>
            )
          })}

          {showBeacon && (
            <div className="rd-beacon">
              <p>This story is generating significant impact. Support our journalism.</p>
              <div className="rd-beacon-opts">
                <button type="button" onClick={() => setPayAmount(5000)}>₹5,000 / yr</button>
                <button type="button" onClick={() => setPayAmount(10000)}>₹10,000 · FOI patron</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {payAmount != null && (
        <div
          className="rd-modal-bg open"
          role="dialog"
          aria-modal="true"
          aria-label="Support ReportersDesk"
          onClick={(e) => e.target === e.currentTarget && setPayAmount(null)}
        >
          <div className="rd-modal">
            <button type="button" className="rd-modal-close" aria-label="Close" onClick={() => setPayAmount(null)}>×</button>
            <h3>Become an FOI Patron</h3>
            <p className="sub">Direct, no-middleman support for independent reporting.</p>
            <div className="rd-tier">
              <button type="button" className={payAmount === 5000 ? 'sel' : ''} onClick={() => setPayAmount(5000)}>
                <span className="amt">₹5,000</span><span className="lbl">Annual</span>
              </button>
              <button type="button" className={payAmount === 10000 ? 'sel' : ''} onClick={() => setPayAmount(10000)}>
                <span className="amt">₹10,000</span><span className="lbl">FOI Patron</span>
              </button>
            </div>
            <div className="rd-qr">
              <div className="rd-qr-box" aria-hidden />
              <div className="rd-qr-note">
                Scan the QR with any UPI app, or tap below on mobile.
                <br />
                <a href={upiLink} className="rd-upi-link">reportersdesk@upi · ₹{payAmount.toLocaleString('en-IN')}</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
