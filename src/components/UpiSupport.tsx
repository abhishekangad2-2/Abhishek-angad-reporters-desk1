'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export const UPI_ID = '9910270994@kotakbank'
export const UPI_NAME = 'Abhishek Angad'

const PLANS = [
  { id: 'reader', label: 'Reader', amount: 5000, blurb: 'Annual support for the newsroom' },
  { id: 'foi', label: 'FOI Patron', amount: 10000, blurb: 'Funds RTI filings and document access' },
] as const

const inr = (n: number) => n.toLocaleString('en-IN')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function upiLink(amount: number, label: string) {
  return (
    `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}` +
    `&am=${amount}&cu=INR&tn=${encodeURIComponent(`Reporters Desk — ${label} membership`)}`
  )
}

export default function UpiSupport({ size = 158 }: { size?: number }) {
  const [planId, setPlanId] = useState<(typeof PLANS)[number]['id']>('reader')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [optIn, setOptIn] = useState(true)
  const [stage, setStage] = useState<'form' | 'pay'>('form')
  const [refId, setRefId] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const plan = PLANS.find((p) => p.id === planId)!

  const proceed = async () => {
    setErr('')
    if (!EMAIL_RE.test(email.trim())) {
      setErr('Please enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/support/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, tier: planId, amount: plan.amount, newsletterOptIn: optIn }),
      })
      const data = await res.json()
      if (res.ok) {
        setRefId(data.referenceId || '')
        setStage('pay')
      } else {
        setErr(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* id is visible to copy manually */
    }
  }

  return (
    <div className="upi-support">
      <div className="upi-plans" role="radiogroup" aria-label="Choose a membership">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={planId === p.id}
            className={`upi-plan-card ${planId === p.id ? 'upi-plan-card--active' : ''}`}
            onClick={() => {
              setPlanId(p.id)
              setStage('form')
            }}
          >
            <span className="upi-plan-amount">₹{inr(p.amount)}</span>
            <span className="upi-plan-period">/ year</span>
            <span className="upi-plan-label">{p.label}</span>
            <span className="upi-plan-blurb">{p.blurb}</span>
          </button>
        ))}
      </div>

      {stage === 'form' ? (
        <form
          className="upi-form"
          onSubmit={(e) => {
            e.preventDefault()
            proceed()
          }}
        >
          <p className="upi-form-lead">Enter your email to continue — your receipt goes here.</p>
          <input
            className="upi-input"
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <input
            className="upi-input"
            type="email"
            required
            placeholder="Email address *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <label className="upi-check">
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} /> Also send me the
            newsletter
          </label>
          {err && <p className="form-error" role="alert">{err}</p>}
          <button type="submit" className="pay-button" disabled={busy}>
            {busy ? 'Please wait…' : `Continue to pay ₹${inr(plan.amount)} →`}
          </button>
        </form>
      ) : (
        <>
          <div className="qr-box">
            <QRCodeSVG value={upiLink(plan.amount, plan.label)} size={size} bgColor="transparent" fgColor="#111111" level="M" />
          </div>
          <p className="qr-caption">Scan to pay ₹{inr(plan.amount)} ({plan.label}) with any UPI app</p>
          <div className="upi-id-row">
            <code className="upi-id">{UPI_ID}</code>
            <button type="button" className="upi-copy" onClick={copy} aria-live="polite">
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <p className="pay-note">
            {refId ? (
              <>
                Your reference: <b>{refId}</b> (also emailed to you). Payments go directly to {UPI_NAME}.
              </>
            ) : (
              <>Payments go directly to {UPI_NAME}.</>
            )}
          </p>
          <button type="button" className="upi-back" onClick={() => setStage('form')}>
            ← Use a different email
          </button>
        </>
      )}
    </div>
  )
}
