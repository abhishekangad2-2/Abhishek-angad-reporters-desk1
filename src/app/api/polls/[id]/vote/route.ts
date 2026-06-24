import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieName = `voted-${params.id}`
  if (req.cookies.get(cookieName)) {
    return NextResponse.json({ error: 'Already voted in this poll.' }, { status: 409 })
  }

  const { option } = await req.json()
  const payload = await getPayload({ config })
  const poll = await payload.findByID({ collection: 'polls', id: params.id })

  const options = poll.options.map((o: any) =>
    o.label === option ? { ...o, voteCount: (o.voteCount ?? 0) + 1 } : o,
  )
  await payload.update({ collection: 'polls', id: params.id, data: { options } })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName, '1', { maxAge: 60 * 60 * 24 * 30, path: '/' })
  return res
}
