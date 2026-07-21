'use client'

import { useState } from 'react'

type RecentDispatch = { id: string; headline: string; significance?: string; publishedAt?: string }

const SIGNIFICANCE = [
  { value: 'normal', label: 'Normal' },
  { value: 'significant', label: 'Significant' },
  { value: 'breaking', label: 'Breaking' },
] as const

const EXPIRY = [
  { value: 0, label: 'No expiry' },
  { value: 6, label: '6 hours' },
  { value: 24, label: '24 hours' },
  { value: 72, label: '3 days' },
] as const

const MAX = 280

/** Mobile-first dispatch composer. A reporter, signed in on their phone, files
 *  a short live update straight into the site-wide floating widget — no CMS.
 *  POSTs to /api/dispatches, which authenticates via the rd_session cookie. */
export default function DispatchComposer({
  initials,
  userName,
  recent,
}: {
  initials: string
  userName: string
  recent: RecentDispatch[]
}) {
  const [message, setMessage] = useState('')
  const [significance, setSignificance] = useState<string>('normal')
  const [ini, setIni] = useState(initials)
  const [expiresHours, setExpiresHours] = useState<number>(0)
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [error, setError] = useState('')
  const [filed, setFiled] = useState<RecentDispatch[]>(recent)

  const remaining = MAX - message.length
  const canSend = message.trim().length >= 3 && remaining >= 0 && status !== 'sending'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSend) return
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/dispatches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), significance, initials: ini, expiresHours }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setError(json.error || 'Something went wrong.')
        return
      }
      setFiled((f) => [
        { id: json.id, headline: message.trim(), significance, publishedAt: new Date().toISOString() },
        ...f,
      ])
      setMessage('')
      setSignificance('normal')
      setStatus('ok')
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
      setError('Network error — check your connection.')
    }
  }

  return (
    <div className="dc-wrap">
      <header className="dc-head">
        <div>
          <span className="dc-eyebrow">ReportersDesk · Live wire</span>
          <h1 className="dc-title">File a dispatch</h1>
        </div>
        <span className="dc-who">{userName}</span>
      </header>

      <form className="dc-card" onSubmit={submit}>
        <label className="dc-label" htmlFor="dc-msg">
          Dispatch
        </label>
        <textarea
          id="dc-msg"
          className="dc-textarea"
          placeholder="What's happening? Keep it short and factual…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={MAX + 40}
          autoFocus
        />
        <div className={`dc-count ${remaining < 0 ? 'over' : ''}`}>{remaining}</div>

        <span className="dc-label">Significance</span>
        <div className="dc-seg" role="group" aria-label="Significance">
          {SIGNIFICANCE.map((s) => (
            <button
              type="button"
              key={s.value}
              className={`dc-seg-btn ${significance === s.value ? 'on' : ''} sig-${s.value}`}
              onClick={() => setSignificance(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="dc-row">
          <div className="dc-field">
            <label className="dc-label" htmlFor="dc-ini">
              Your initials
            </label>
            <input
              id="dc-ini"
              className="dc-input"
              value={ini}
              onChange={(e) => setIni(e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
              inputMode="text"
            />
          </div>
          <div className="dc-field">
            <label className="dc-label" htmlFor="dc-exp">
              Auto-expire
            </label>
            <select
              id="dc-exp"
              className="dc-input"
              value={expiresHours}
              onChange={(e) => setExpiresHours(Number(e.target.value))}
            >
              {EXPIRY.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {status === 'error' && <p className="dc-msg dc-msg--err">{error}</p>}
        {status === 'ok' && <p className="dc-msg dc-msg--ok">Filed — it is live now.</p>}

        <button className="dc-send" type="submit" disabled={!canSend}>
          {status === 'sending' ? 'Filing…' : 'File dispatch →'}
        </button>
      </form>

      <section className="dc-recent">
        <h2 className="dc-recent-title">Recent dispatches</h2>
        {filed.length === 0 && <p className="dc-empty">Nothing filed yet.</p>}
        {filed.map((d) => (
          <div className="dc-recent-item" key={d.id}>
            <span className={`dc-dot ${d.significance === 'breaking' ? 'hi' : d.significance === 'significant' ? 'md' : 'lo'}`} />
            <span className="dc-recent-text">{d.headline}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
