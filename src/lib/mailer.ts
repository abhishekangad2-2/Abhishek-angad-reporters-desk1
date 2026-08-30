import nodemailer from 'nodemailer'

// Provider-agnostic email sending. Prefers SMTP (your own Gmail, or any SMTP
// host — Google Workspace, SES-SMTP, etc.), so the newsletter never depends on
// a single third-party API. Falls back to Resend only if that's the only thing
// configured. Nothing configured → send is skipped (safe to ship dark).

let cached: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (cached) return cached
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) return null
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (process.env.SMTP_SECURE ?? 'true') !== 'false', // 465 = TLS
    auth: { user, pass },
  })
  return cached
}

/** True when some send path is configured (SMTP or Resend). */
export function mailerConfigured(): boolean {
  const key = process.env.RESEND_API_KEY
  return Boolean((process.env.SMTP_USER && process.env.SMTP_PASS) || (key && key !== 'none'))
}

/** Which channel is active — for logging. */
export function mailerChannel(): 'smtp' | 'resend' | 'none' {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp'
  const key = process.env.RESEND_API_KEY
  if (key && key !== 'none') return 'resend'
  return 'none'
}

export async function sendMail(opts: {
  from: string
  to: string
  subject: string
  html: string
  headers?: Record<string, string>
}): Promise<boolean> {
  const t = getTransporter()
  if (t) {
    try {
      await t.sendMail(opts)
      return true
    } catch {
      return false
    }
  }
  const key = process.env.RESEND_API_KEY
  if (key && key !== 'none') {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      })
      return res.ok
    } catch {
      return false
    }
  }
  return false
}
