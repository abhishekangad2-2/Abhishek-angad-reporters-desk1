import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Public, read-only feed of the most recent live dispatches for the floating
// "Live Dispatches" widget (IDPB). Dynamic so it never tries to hit the DB at
// build time and degrades gracefully if Payload/DB is unreachable.
export const dynamic = 'force-dynamic'

function relativeTime(input?: string | null): string {
  if (!input) return ''
  const then = new Date(input).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Math.max(0, Date.now() - then)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  return `${day}d`
}

function initialsFor(doc: any): string {
  if (doc.initials) return String(doc.initials).toUpperCase()
  const author = Array.isArray(doc.author) ? doc.author[0] : doc.author
  if (author && typeof author === 'object') {
    const f = author.firstName?.[0] ?? ''
    const l = author.lastName?.[0] ?? ''
    const ini = (f + l).toUpperCase()
    if (ini) return ini
  }
  return '??'
}

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const result = await payload.find({
      collection: 'live-dispatches',
      where: {
        or: [{ expiresAt: { greater_than: now } }, { expiresAt: { exists: false } }],
      },
      sort: '-publishedAt',
      limit: 6,
      depth: 1,
    })

    const dispatches = result.docs.map((d: any) => {
      const flagRaw = d.significance && d.significance !== 'normal' ? d.significance : ''
      const flag = flagRaw ? flagRaw.charAt(0).toUpperCase() + flagRaw.slice(1) : ''
      const postedAt = d.publishedAt ?? d.createdAt
      return {
        id: d.id,
        initials: initialsFor(d),
        text: d.headline,
        flag, // '' | 'Significant' | 'Breaking'
        postedAt,
        time: relativeTime(postedAt),
      }
    })

    return NextResponse.json({ dispatches })
  } catch {
    // DB unreachable (e.g. at build/preview) — degrade gracefully.
    return NextResponse.json({ dispatches: [] })
  }
}
