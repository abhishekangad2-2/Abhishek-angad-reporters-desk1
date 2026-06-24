import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../payload.config'

export async function GET() {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()
  const result = await payload.find({
    collection: 'live-dispatches',
    where: { or: [{ expiresAt: { greater_than: now } }, { expiresAt: { exists: false } }] },
    sort: '-postedAt',
    limit: 5,
    depth: 1, // resolves the journalist relationship so .initials is available
  })

  return NextResponse.json(
    result.docs.map((d: any) => ({
      id: d.id,
      text: d.text,
      journalist: { initials: d.journalist?.initials ?? '??', name: d.journalist?.name ?? '' },
      postedAt: d.postedAt,
    })),
  )
}
