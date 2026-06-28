'use client'

import { useCallback, useEffect, useState } from 'react'

// IDPB — Intelligent Dispatch & Patronage Beacon.
// Floating, collapsible "Live Dispatches" panel anchored bottom-right on all
// public pages. Polls /api/dispatches, renders the newsroom feed with a
// Plexus-Pulse ripple on Significant/Breaking dispatches, per-dispatch share
// links, and a contextual Patronage Beacon that opens a UPI payment modal.

type Dispatch = {
  id: string | number
  initials: string
  text: string
  flag: '' | 'Significant' | 'Breaking' | string
  postedAt?: string
  time: string
}

const SITE_URL = 'https://reportersdesk.abhishekangad.com'
const POLL_MS = 20_000
const BEACON_DELAY_MS = 6_000

export default function LiveDispatches() {
  // Start COLLAPSED so it never covers content on load.
  const [collapsed, setCollapsed] = useState(true)
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [showBeacon, setShowBeacon] = useState(false)
  const [payAmount, setPayAmount] = useState<number | null>(null)

  const fetchDispatches = useCallback(async () => {
    try {
      const res = await fetch('/api/dispatches', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data?.dispatches)) setDispatches(data.dispatches)
    } catch {
      // Non-critical widget — fail quietly (e.g. DB unreachable).
    }
  }, [])

  useEffect(() => {
    fetchDispatches()
    const id = setInterval(fetchDispatches, POLL_MS)
    return () => clearInterval(id)
  }, [fetchDispatches])

  // Patronage Beacon appears after a short delay (simulated "significant
  // engagement"), once there's at least one dispatch to anchor it to.
  useEffect(() => {
    if (dispatches.length === 0) return
    const id = setTimeout(() => setShowBeacon(true), BEACON_DELAY_MS)
    return () => clearTimeout(id)
  }, [dispatches.length])

  // Esc closes the payment modal.
  useEffect(() => {
    if (payAmount == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPayAmount(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [payAmount])

  if (dispatches.length === 0) return null

  const upiLink =
    payAmount != null
      ? `upi://pay?pa=reportersdesk@upi&pn=ReportersDesk&am=${payAmount}&cu=INR&tn=Patronage`
      : ''

  return (
    <>
      <div className={`rd-dispatch ${collapsed ? 'collapsed' : ''}`}>
        <div className="rd-dispatch-head">
          <span className="rd-dispatch-title">
            <span className="rd-live-dot" aria-hidden />
            Live Dispatches
          </span>
          <button
            type="button"
            className="rd-dispatch-toggle"
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand live dispatches' : 'Collapse live dispatches'}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? '▴' : '▾'}
          </button>
        </div>

        <div className="rd-dispatch-body">
          {dispatches.map((d) => {
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
                  <a
                    href={`https://twitter.com/intent/tweet?text=${share}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                  <a
                    href={`https://wa.me/?text=${share}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Facebook
                  </a>
                </div>
              </div>
            )
          })}

          {showBeacon && (
            <div className="rd-beacon">
              <p>This story is generating significant impact. Support our journalism.</p>
              <div className="rd-beacon-opts">
                <button type="button" onClick={() => setPayAmount(5000)}>
                  ₹5,000 / yr
                </button>
                <button type="button" onClick={() => setPayAmount(10000)}>
                  ₹10,000 · FOI patron
                </button>
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setPayAmount(null)
          }}
        >
          <div className="rd-modal">
            <button
              type="button"
              className="rd-modal-close"
              aria-label="Close"
              onClick={() => setPayAmount(null)}
            >
              ×
            </button>
            <h3>Become an FOI Patron</h3>
            <p className="sub">Direct, no-middleman support for independent reporting.</p>

            <div className="rd-tier">
              <button
                type="button"
                className={payAmount === 5000 ? 'sel' : ''}
                onClick={() => setPayAmount(5000)}
              >
                <span className="amt">₹5,000</span>
                <span className="lbl">Annual</span>
              </button>
              <button
                type="button"
                className={payAmount === 10000 ? 'sel' : ''}
                onClick={() => setPayAmount(10000)}
              >
                <span className="amt">₹10,000</span>
                <span className="lbl">FOI Patron</span>
              </button>
            </div>

            <div className="rd-qr">
              <div className="rd-qr-box" aria-hidden />
              <div className="rd-qr-note">
                Scan the QR with any UPI app, or tap below on mobile.
                <br />
                <a href={upiLink} className="rd-upi-link">
                  reportersdesk@upi · ₹{payAmount.toLocaleString('en-IN')}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
