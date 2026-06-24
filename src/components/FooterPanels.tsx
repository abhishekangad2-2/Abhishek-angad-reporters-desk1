'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { Poll } from '../../lib/types'

const PLANS = [
  { id: 'reader', label: 'Reader', amount: 5000, blurb: 'Annual support for the newsroom' },
  { id: 'foi-patron', label: 'FOI Patron', amount: 10000, blurb: 'Funds RTI filings and document access' },
] as const

export function PaymentTab() {
  const [planId, setPlanId] = useState<(typeof PLANS)[number]['id']>('reader')
  const plan = PLANS.find((p) => p.id === planId)!

  // Illustrative only. In production, POST to /api/payments/create-subscription
  // and use the UPI intent / QR string Razorpay hands back — never construct
  // the payable amount or VPA on the client, since nothing here is tied to a
  // tracked subscription record until the webhook (see app/api/webhooks/razorpay)
  // confirms it.
  const upiUri = `upi://pay?pa=reportersdesk@upi&pn=ReportersDesk&am=${plan.amount}&cu=INR&tn=ReportersDesk ${plan.label} subscription`

  return (
    <div className="footer-panel">
      <div className="plan-row" role="radiogroup" aria-label="Choose a plan">
        {PLANS.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={planId === p.id}
            className={`plan-card ${planId === p.id ? 'plan-card--active' : ''}`}
            onClick={() => setPlanId(p.id)}
          >
            <span className="plan-card-label">{p.label}</span>
            <span className="plan-card-amount">₹{p.amount.toLocaleString('en-IN')}/yr</span>
            <span className="plan-card-blurb">{p.blurb}</span>
          </button>
        ))}
      </div>

      <div className="pay-row">
        <div className="qr-box">
          <QRCodeSVG value={upiUri} size={132} bgColor="transparent" />
          <p className="qr-caption">Scan with any UPI app</p>
        </div>
        <a className="pay-button" href={upiUri}>
          Pay with UPI app
        </a>
      </div>
      <p className="pay-note">
        Renews automatically each year via UPI Autopay. Cancel anytime from the email receipt.
      </p>
    </div>
  )
}

export function NewsletterTab() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: window.location.pathname }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return <p className="footer-panel">You're subscribed. Watch your inbox.</p>
  }

  return (
    <form className="footer-panel" onSubmit={handleSubmit}>
      <label htmlFor="newsletter-email">Get reporting like this in your inbox</label>
      <div className="newsletter-row">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      {status === 'error' && <p className="form-error">Something went wrong — try again.</p>}
    </form>
  )
}

export function PollTab() {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    fetch('/api/polls/current')
      .then((r) => r.json())
      .then(setPoll)
      .catch(() => setPoll(null))
  }, [])

  if (!poll) return <p className="footer-panel">No poll running right now.</p>

  const total = poll.options.reduce((sum, o) => sum + o.voteCount, 0)
  const showResults = voted || poll.resultsVisible === 'live'

  async function vote(label: string) {
    setVoted(true) // optimistic — the vote endpoint is idempotent per-browser via cookie anyway
    await fetch(`/api/polls/${poll!.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option: label }),
    })
  }

  return (
    <div className="footer-panel">
      <p className="poll-question">{poll.question}</p>
      <ul className="poll-options">
        {poll.options.map((o) => (
          <li key={o.label}>
            <button disabled={voted} onClick={() => vote(o.label)} className="poll-option">
              <span>{o.label}</span>
              {showResults && (
                <span
                  className="poll-bar"
                  style={{ width: `${total ? (o.voteCount / total) * 100 : 0}%` }}
                />
              )}
              {showResults && (
                <span className="poll-pct">{total ? Math.round((o.voteCount / total) * 100) : 0}%</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function FounderBioTab() {
  return (
    <div className="footer-panel founder-bio">
      <h3>Abhishek Angad</h3>
      {/* Placeholder copy — replace with the real two-or-three-sentence bio
          before launch. Deliberately not inventing biographical claims here. */}
      <p>Founder and editor of ReportersDesk. Full bio to come.</p>
      <a href="/about/abhishek-angad">Read the full profile →</a>
    </div>
  )
}
