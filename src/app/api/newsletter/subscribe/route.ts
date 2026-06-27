import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../payload.config'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  // 3 subscribe attempts per IP per hour
  if (!checkRateLimit(`subscribe:${getClientIp(req)}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const { email, source } = await req.json()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  try {
    await payload.create({
      collection: 'newsletter-subscribers',
      data: { email, source, status: 'active' },
    })
  } catch (err: any) {
    // A unique-constraint error means they're already subscribed —
    // treat that as success rather than surfacing a confusing error.
    if (!String(err.message).toLowerCase().includes('unique')) {
      return NextResponse.json({ error: 'Could not subscribe right now.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
