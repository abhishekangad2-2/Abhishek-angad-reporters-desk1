import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // 10 poll votes per IP per hour across all polls
  if (!checkRateLimit(`vote:${getClientIp(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const cookieName = `voted-${id}`
  if (req.cookies.get(cookieName)) {
    return NextResponse.json({ error: 'Already voted in this poll.' }, { status: 409 })
  }

  const { option } = await req.json()
  const payload = await getPayload({ config })
  const poll = await payload.findByID({ collection: 'polls', id })

  // Match by `label` and increment `voteCount` — both now aligned with the Polls collection schema
  const options = poll.options.map((o: any) =>
    o.label === option ? { ...o, voteCount: (o.voteCount ?? 0) + 1 } : o,
  )
  await payload.update({ collection: 'polls', id, data: { options } })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName, '1', { maxAge: 60 * 60 * 24 * 30, path: '/' })
  return res
}

