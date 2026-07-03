'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import type { Poll } from '../../lib/types'

const PLANS = [
  { id: 'reader', label: 'Reader', amount: 5000, blurb: 'Annual support for the newsroom' },
  { id: 'foi-patron', label: 'FOI Patron', amount: 10000, blurb: 'Funds RTI filings and document access' },
] as const

// Deterministic thousands grouping — Intl/toLocaleString can format differently
// on the server vs the browser and break hydration (React #418).
const inr = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

const RAZORPAY_CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

// Lazily inject Razorpay's checkout.js once and resolve when window.Razorpay is
// available. Returns null if it can't load (offline / blocked) so callers fall
// back to the hosted short_url.
function loadRazorpayCheckout(): Promise<any | null> {
  return new Promise((resolve) => {
    const w = window as any
    if (w.Razorpay) return resolve(w.Razorpay)
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).Razorpay ?? null))
      existing.addEventListener('error', () => resolve(null))
      return
    }
    const s = document.createElement('script')
    s.src = RAZORPAY_CHECKOUT_SRC
    s.async = true
    s.onload = () => resolve((window as any).Razorpay ?? null)
    s.onerror = () => resolve(null)
    document.body.appendChild(s)
  })
}

type PayStatus = 'idle' | 'checking' | 'unconfigured' | 'loading' | 'success' | 'error'

export function PaymentTab() {
  const [planId, setPlanId] = useState<(typeof PLANS)[number]['id']>('reader')
  const [status, setStatus] = useState<PayStatus>('checking')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [keyId, setKeyId] = useState<string | null>(null)
  const plan = PLANS.find((p) => p.id === planId)!

  // Probe config on mount so the UI can show the right state before the user
  // clicks. Graceful degradation: configured:false → "payments not configured".
  useEffect(() => {
    let cancelled = false
    fetch('/api/payments/create-subscription')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data?.configured) {
          setKeyId(data.keyId ?? null)
          setStatus('idle')
        } else {
          setStatus('unconfigured')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('unconfigured')
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubscribe() {
    setStatus('loading')
    setPaymentUrl(null)
    try {
      const res = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()

      if (data?.configured === false) {
        setStatus('unconfigured')
        return
      }
      if (!res.ok || !data?.subscriptionId) {
        setStatus('error')
        return
      }

      // Preferred path: open Razorpay Checkout in subscription mode.
      const Razorpay = await loadRazorpayCheckout()
      const checkoutKey = data.keyId ?? keyId
      if (Razorpay && checkoutKey) {
        const rzp = new Razorpay({
          key: checkoutKey,
          subscription_id: data.subscriptionId,
          name: 'ReportersDesk',
          description: `${plan.label} — ₹${inr(plan.amount)}/yr`,
          handler: () => {
            // Payment authorised in the browser. The webhook is the source of
            // truth for activation; this just updates the UI.
            setStatus('success')
          },
          modal: {
            ondismiss: () => {
              // User closed the sheet without paying — return to idle, no error.
              setStatus('idle')
            },
          },
          theme: { color: '#111111' },
        })
        rzp.on('payment.failed', () => setStatus('error'))
        rzp.open()
        setStatus('idle')
        return
      }

      // Fallback: no checkout.js (blocked/offline) → show the hosted QR + link.
      if (data.paymentUrl) {
        setPaymentUrl(data.paymentUrl)
        setStatus('idle')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'unconfigured') {
    return (
      <div className="footer-panel">
        <p className="pay-note">
          Online payments aren&apos;t set up yet. Please check back soon — we&apos;re finalising our
          payment gateway.
        </p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="footer-panel" role="status">
        <p>Thank you for supporting independent journalism. Your subscription is being activated — watch your inbox for a receipt.</p>
      </div>
    )
  }

  return (
    <div className="footer-panel">
      <div className="plan-row" role="radiogroup" aria-label="Choose a plan">
        {PLANS.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={planId === p.id}
            className={`plan-card ${planId === p.id ? 'plan-card--active' : ''}`}
            onClick={() => { setPlanId(p.id); setPaymentUrl(null) }}
          >
            <span className="plan-card-label">{p.label}</span>
            <span className="plan-card-amount">₹{inr(p.amount)}/yr</span>
            <span className="plan-card-blurb">{p.blurb}</span>
          </button>
        ))}
      </div>

      {paymentUrl ? (
        <div className="pay-row">
          <div className="qr-box">
            <QRCodeSVG value={paymentUrl} size={132} bgColor="transparent" />
            <p className="qr-caption">Scan with any UPI app</p>
          </div>
          <a className="pay-button" href={paymentUrl} target="_blank" rel="noopener noreferrer">
            Pay with UPI app
          </a>
        </div>
      ) : (
        <button
          className="pay-button"
          onClick={handleSubscribe}
          disabled={status === 'loading' || status === 'checking'}
        >
          {status === 'loading'
            ? 'Preparing payment…'
            : status === 'checking'
              ? 'Loading…'
              : `Subscribe — ₹${inr(plan.amount)}/yr`}
        </button>
      )}

      {status === 'error' && (
        <p className="form-error" role="alert">Could not start the payment. Please try again.</p>
      )}

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
    return <p className="footer-panel" role="status">You&apos;re subscribed. Watch your inbox.</p>
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
      {status === 'error' && <p className="form-error" role="alert">Something went wrong — try again.</p>}
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
          // `label` and `voteCount` — aligned with the updated Polls collection schema
          <li key={o.label}>
            <button disabled={voted} onClick={() => vote(o.label)} className="poll-option">
              <span>{o.label}</span>
              {showResults && (
                <span
                  className="poll-bar"
                  aria-hidden="true"
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

const INVESTIGATE_SECTIONS = [
  { value: '', label: 'Pick a desk (optional)' },
  { value: 'accountability', label: 'Accountability' },
  { value: 'politics', label: 'Politics & Power' },
  { value: 'business', label: 'Business & Money' },
  { value: 'environment', label: 'Environment' },
  { value: 'local', label: 'Local / Civic' },
  { value: 'other', label: 'Other / Unsure' },
] as const

export function InvestigateTab() {
  const [topic, setTopic] = useState('')
  const [details, setDetails] = useState('')
  const [email, setEmail] = useState('')
  const [section, setSection] = useState('')
  const [optIn, setOptIn] = useState(false)
  // Honeypot — must stay empty. Real users never see or fill this.
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          details,
          email,
          section,
          newsletterOptIn: optIn,
          website,
          source: window.location.pathname,
        }),
      })
      if (res.ok) {
        setStatus('done')
      } else {
        const data = await res.json().catch(() => null)
        setErrorMsg(data?.error ?? 'Something went wrong — try again.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Something went wrong — try again.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="footer-panel" role="status">
        <p className="investigate-pitch">Thank you — your tip is with the newsroom.</p>
        <p className="pay-note">
          We read every lead. If you left an email, we may reach out for more detail.
        </p>
      </div>
    )
  }

  return (
    <form className="footer-panel investigate-form" onSubmit={handleSubmit}>
      <p className="investigate-pitch">Got a lead? Tell us what to investigate.</p>
      <p className="pay-note investigate-sub">
        Tips are confidential. Email is optional — leave it blank to stay anonymous.
      </p>

      <div className="investigate-field">
        <label htmlFor="investigate-topic">What should we look into?</label>
        <input
          id="investigate-topic"
          type="text"
          required
          maxLength={200}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Misuse of the city road-repair fund"
        />
      </div>

      <div className="investigate-field">
        <label htmlFor="investigate-details">The lead</label>
        <textarea
          id="investigate-details"
          required
          rows={4}
          maxLength={5000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="What you know, who's involved, why it matters."
        />
      </div>

      <div className="investigate-field">
        <label htmlFor="investigate-section">Which desk?</label>
        <select
          id="investigate-section"
          value={section}
          onChange={(e) => setSection(e.target.value)}
        >
          {INVESTIGATE_SECTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="investigate-field">
        <label htmlFor="investigate-email">Email (optional, for follow-up)</label>
        <input
          id="investigate-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <label className="investigate-optin">
        <input
          type="checkbox"
          checked={optIn}
          onChange={(e) => setOptIn(e.target.checked)}
        />
        <span>Also send me the newsletter</span>
      </label>

      {/* Honeypot — visually hidden, off-screen, ignored by real users. */}
      <div className="investigate-hp" aria-hidden="true">
        <label htmlFor="investigate-website">Leave this field empty</label>
        <input
          id="investigate-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <button className="pay-button" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Send the tip'}
      </button>

      {status === 'error' && <p className="form-error" role="alert">{errorMsg}</p>}
    </form>
  )
}

export function FounderBioTab() {
  return (
    <div className="footer-panel founder-bio">
      <h2 className="founder-bio-h">Abhishek Angad</h2>
      {/* Replace the paragraph below with the real bio before launch. */}
      <p>Founder and editor of ReportersDesk. Independent journalist covering accountability, power, and public institutions.</p>
      <Link href="/founder">Read the full bio →</Link>
    </div>
  )
}
