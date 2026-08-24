'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// Direct UPI support — a collect QR built from the newsroom's UPI ID, so any
// UPI app can scan-to-pay any amount without a payment gateway.
export const UPI_ID = '9910270994@kotakbank'
export const UPI_NAME = 'Abhishek Angad'
export const UPI_LINK = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&cu=INR`

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
      <div className="qr-box">
        <QRCodeSVG value={UPI_LINK} size={size} bgColor="transparent" fgColor="#111111" level="M" />
      </div>
      <p className="qr-caption">Scan to pay with any UPI app</p>
      <div className="upi-id-row">
        <code className="upi-id">{UPI_ID}</code>
        <button type="button" className="upi-copy" onClick={copy} aria-live="polite">
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <p className="pay-note">
        Pay any amount to support independent journalism. Payments go directly to {UPI_NAME}.
      </p>
    </div>
  )
}
