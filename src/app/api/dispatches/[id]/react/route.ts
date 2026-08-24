import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Public ❤ on a dispatch (The Wire). No account — the client de-dupes with
// localStorage; a light per-IP+dispatch throttle curbs trivial spam. Returns
// the new count.
export const dynamic = 'force-dynamic'

const recent = new Map<string, number>() // `${ip}:${id}` -> last ts

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim()
  const key = `${ip}:${id}`
  const last = recent.get(key) ?? 0
  if (Date.now() - last < 3000) {
    return NextResponse.json({ error: 'slow down' }, { status: 429 })
  }
  recent.set(key, Date.now())

  try {
    const payload = await getPayload({ config })
    const doc = await payload.findByID({ collection: 'live-dispatches', id, depth: 0 }).catch(() => null)
    if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const cur = Number((doc as Record<string, unknown>).reactions ?? 0)
    const next = (Number.isFinite(cur) ? cur : 0) + 1
    await payload.update({ collection: 'live-dispatches', id, data: { reactions: next }, overrideAccess: true })
    return NextResponse.json({ ok: true, reactions: next })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
