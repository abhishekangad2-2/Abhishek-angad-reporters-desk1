import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../payload.config'

export async function GET() {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()
  const result = await payload.find({
    collection: 'live-dispatches',
    where: {
      or: [
        { expiresAt: { greater_than: now } },
        { expiresAt: { exists: false } },
      ],
    },
    sort: '-publishedAt',
    limit: 5,
    depth: 1, // resolves the author relationship
  })

  return NextResponse.json(
    result.docs.map((d: any) => ({
      id: d.id,
      text: d.headline,   // headline is the short dispatch text
      journalist: {
        // initials is a top-level text field on the dispatch doc itself
        initials: d.initials ?? (d.author?.[0] ? getInitials(d.author[0]) : '??'),
        name: d.author?.[0]
          ? `${d.author[0].firstName ?? ''} ${d.author[0].lastName ?? ''}`.trim()
          : '',
      },
      postedAt: d.publishedAt ?? d.createdAt,
    })),
  )
}

function getInitials(user: any): string {
  const first = user.firstName?.[0] ?? ''
  const last = user.lastName?.[0] ?? ''
  return (first + last).toUpperCase() || '??'
}

