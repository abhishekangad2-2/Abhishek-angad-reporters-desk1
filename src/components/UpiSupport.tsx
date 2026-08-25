'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// Direct UPI membership — a collect QR built from the newsroom's UPI ID with the
// ₹5,000/year amount pre-filled, so any UPI app scans straight to that amount.
export const UPI_ID = '9910270994@kotakbank'
export const UPI_NAME = 'Abhishek Angad'
export const MEMBERSHIP_AMOUNT = 5000
export const UPI_LINK =
  `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}` +
  `&am=${MEMBERSHIP_AMOUNT}&cu=INR&tn=${encodeURIComponent('Reporters Desk annual membership')}`

export default function UpiSupport({ size = 158 }: { size?: number }) {
  const [copied, setCopied] = useState(false)
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
      <div className="upi-plan">
        <span className="upi-amount">₹{MEMBERSHIP_AMOUNT.toLocaleString('en-IN')}</span>
        <span className="upi-period">/ year membership</span>
      </div>
      <div className="qr-box">
        <QRCodeSVG value={UPI_LINK} size={size} bgColor="transparent" fgColor="#111111" level="M" />
      </div>
      <p className="qr-caption">Scan to pay ₹{MEMBERSHIP_AMOUNT.toLocaleString('en-IN')} with any UPI app</p>
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
