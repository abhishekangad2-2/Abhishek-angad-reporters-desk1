'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// Direct UPI membership — a collect QR built from the newsroom's UPI ID with the
// chosen tier's amount pre-filled, so any UPI app scans straight to that amount.
export const UPI_ID = '9910270994@kotakbank'
export const UPI_NAME = 'Abhishek Angad'

const PLANS = [
  { id: 'reader', label: 'Reader', amount: 5000, blurb: 'Annual support for the newsroom' },
  { id: 'foi', label: 'FOI Patron', amount: 10000, blurb: 'Funds RTI filings and document access' },
] as const

const inr = (n: number) => n.toLocaleString('en-IN')

function upiLink(amount: number, label: string) {
  return (
    `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}` +
    `&am=${amount}&cu=INR&tn=${encodeURIComponent(`Reporters Desk — ${label} membership`)}`
  )
}

export default function UpiSupport({ size = 158 }: { size?: number }) {
  const [planId, setPlanId] = useState<(typeof PLANS)[number]['id']>('reader')
  const [copied, setCopied] = useState(false)
  const plan = PLANS.find((p) => p.id === planId)!

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the id is visible to copy manually */
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
            onClick={() => setPlanId(p.id)}
          >
            <span className="upi-plan-amount">₹{inr(p.amount)}</span>
            <span className="upi-plan-period">/ year</span>
            <span className="upi-plan-label">{p.label}</span>
            <span className="upi-plan-blurb">{p.blurb}</span>
          </button>
        ))}
      </div>

      <div className="qr-box">
        <QRCodeSVG value={upiLink(plan.amount, plan.label)} size={size} bgColor="transparent" fgColor="#111111" level="M" />
      </div>
      <p className="qr-caption">
        Scan to pay ₹{inr(plan.amount)} ({plan.label}) with any UPI app
      </p>
      <div className="upi-id-row">
        <code className="upi-id">{UPI_ID}</code>
        <button type="button" className="upi-copy" onClick={copy} aria-live="polite">
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <p className="pay-note">
        An annual membership supporting independent journalism. Payments go directly to {UPI_NAME}.
        You can also enter a different amount in your UPI app.
      </p>
    </div>
  )
}
