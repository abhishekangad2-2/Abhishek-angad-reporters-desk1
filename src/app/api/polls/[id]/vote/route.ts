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

  let option: unknown
  try {
    ;({ option } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
  if (typeof option !== 'string' || !option) {
    return NextResponse.json({ error: 'A poll option is required.' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const poll = await payload.findByID({ collection: 'polls', id }).catch(() => null)
  if (!poll) {
    return NextResponse.json({ error: 'Poll not found.' }, { status: 404 })
  }

  // Match by `label` and increment `voteCount`. Reject an option that isn't in
  // the poll rather than silently no-op'ing (and setting the voted cookie).
  if (!poll.options.some((o: any) => o.label === option)) {
    return NextResponse.json({ error: 'Unknown poll option.' }, { status: 400 })
  }
  const options = poll.options.map((o: any) =>
    o.label === option ? { ...o, voteCount: (o.voteCount ?? 0) + 1 } : o,
  )
  await payload.update({ collection: 'polls', id, data: { options } })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName, '1', { maxAge: 60 * 60 * 24 * 30, path: '/' })
  return res
}

