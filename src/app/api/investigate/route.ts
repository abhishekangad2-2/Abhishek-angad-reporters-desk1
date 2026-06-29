import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../payload.config'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SECTIONS = ['accountability', 'politics', 'business', 'environment', 'local', 'other']

export async function POST(req: NextRequest) {
  // 5 tip submissions per IP per hour — generous enough for a genuine reader,
  // tight enough to blunt automated spam.
  if (!checkRateLimit(`investigate:${getClientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { topic, details, email, section, newsletterOptIn, source, website } = body ?? {}

  // Honeypot: `website` is a hidden field no human fills in. If it's set, this
  // is almost certainly a bot — return a 200 so the bot thinks it succeeded.
  if (typeof website === 'string' && website.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  // --- Validation ---
  if (typeof topic !== 'string' || topic.trim().length < 3 || topic.length > 200) {
    return NextResponse.json({ error: 'A topic between 3 and 200 characters is required.' }, { status: 400 })
  }
  if (typeof details !== 'string' || details.trim().length < 10 || details.length > 5000) {
    return NextResponse.json({ error: 'Please add at least a sentence of detail (max 5000 chars).' }, { status: 400 })
  }
  // Email is optional (anonymous tips allowed) but must be valid if provided.
  const hasEmail = typeof email === 'string' && email.trim() !== ''
  if (hasEmail && !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'That email address looks invalid.' }, { status: 400 })
  }
  const optIn = newsletterOptIn === true
  if (optIn && !hasEmail) {
    return NextResponse.json({ error: 'An email is required to receive the newsletter.' }, { status: 400 })
  }
  const cleanSection = typeof section === 'string' && SECTIONS.includes(section) ? section : undefined

  const payload = await getPayload({ config })

  try {
    await payload.create({
      collection: 'investigate-requests',
      data: {
        topic: topic.trim(),
        details: details.trim(),
        email: hasEmail ? email.trim() : undefined,
        section: cleanSection,
        newsletterOptIn: optIn,
        status: 'new',
        source: typeof source === 'string' ? source.slice(0, 300) : undefined,
      },
    })
  } catch (err: any) {
    payload.logger?.error?.(`[Investigate] create failed: ${err?.message}`)
    return NextResponse.json({ error: 'Could not submit your tip right now.' }, { status: 500 })
  }

  // Newsletter opt-in — degrade gracefully on every step.
  if (optIn && hasEmail) {
    // 1. Record the subscriber locally (mirrors /api/newsletter/subscribe).
    try {
      await payload.create({
        collection: 'newsletter-subscribers',
        data: { email: email.trim(), source: 'investigate-callout', status: 'active' },
      })
    } catch (err: any) {
      // Unique-constraint = already subscribed; anything else we just log.
      if (!String(err?.message).toLowerCase().includes('unique')) {
        payload.logger?.warn?.(`[Investigate] newsletter record failed: ${err?.message}`)
      }
    }

    // 2. If Resend is configured, add them to the audience too. Optional — the
    // tip submission already succeeded, so failures here never fail the request.
    const resendKey = process.env.RESEND_API_KEY
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (resendKey && resendKey !== 'none' && audienceId) {
      try {
        await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), unsubscribed: false }),
        })
      } catch (err: any) {
        payload.logger?.warn?.(`[Investigate] Resend subscribe failed: ${err?.message}`)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
