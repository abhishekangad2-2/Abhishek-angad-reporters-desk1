import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// GET /api/comments?story=<id> — visible comments for a story, oldest first so
// a conversation reads top-to-bottom.
export async function GET(req: NextRequest) {
  const storyId = req.nextUrl.searchParams.get('story')
  if (!storyId) {
    return NextResponse.json({ error: 'Missing story id.' }, { status: 400 })
  }
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'comments' as any,
      where: {
        story: { equals: storyId },
        status: { equals: 'visible' },
      },
      sort: 'createdAt',
      depth: 0,
      limit: 500,
    })
    const comments = res.docs.map((c: any) => ({
      id: c.id,
      author: c.author,
      body: c.body,
      createdAt: c.createdAt,
    }))
    return NextResponse.json({ comments })
  } catch {
    // Never surface a 500 to readers — an empty thread is a fine fallback.
    return NextResponse.json({ comments: [] })
  }
}

// POST /api/comments — leave a comment. Auto-published (status 'visible').
export async function POST(req: NextRequest) {
  // 6 comments per IP per 10 minutes.
  if (!checkRateLimit(`comment:${getClientIp(req)}`, 6, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'You are commenting too quickly. Try again shortly.' }, { status: 429 })
  }

  let data: any
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { story, storySlug, author, body, website } = data ?? {}

  // Honeypot — bots fill hidden fields; humans never see this one.
  if (website) {
    return NextResponse.json({ ok: true })
  }

  const name = typeof author === 'string' ? author.trim() : ''
  const text = typeof body === 'string' ? body.trim() : ''

  if (!story) {
    return NextResponse.json({ error: 'Missing story reference.' }, { status: 400 })
  }
  if (!name || name.length > 80) {
    return NextResponse.json({ error: 'A name (under 80 characters) is required.' }, { status: 400 })
  }
  if (!text || text.length > 4000) {
    return NextResponse.json({ error: 'A comment (under 4000 characters) is required.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const created = await payload.create({
      collection: 'comments' as any,
      data: {
        author: name,
        body: text,
        story,
        storySlug: typeof storySlug === 'string' ? storySlug : undefined,
        status: 'visible',
      },
    })
    return NextResponse.json({
      ok: true,
      comment: { id: created.id, author: name, body: text, createdAt: (created as any).createdAt },
    })
  } catch {
    return NextResponse.json({ error: 'Could not post your comment right now.' }, { status: 500 })
  }
}
