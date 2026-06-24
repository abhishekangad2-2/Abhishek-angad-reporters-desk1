import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../payload.config'

export async function GET() {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()
  const result = await payload.find({
    collection: 'polls',
    where: {
      and: [
        { opensAt: { less_than_equal: now } },
        { closesAt: { greater_than: now } },
        { active: { equals: true } },
      ],
    },
    sort: '-opensAt',
    limit: 1,
  })
  return NextResponse.json(result.docs[0] ?? null)
}

