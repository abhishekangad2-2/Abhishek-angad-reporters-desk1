import { createHmac } from 'crypto'

// A per-email unsubscribe token so an unsubscribe link can't be forged for
// someone else. Signed with PAYLOAD_SECRET.
export function unsubToken(email: string): string {
  const secret = process.env.PAYLOAD_SECRET || 'reporters-desk'
  return createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('hex').slice(0, 32)
}

export function unsubUrl(email: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://reporters-desk.org'
  return `${site}/api/newsletter/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`
}
