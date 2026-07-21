import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getSessionUser } from '@/lib/auth/session'

// GET: public, read-only feed of the most recent live dispatches for the
// floating "Live Dispatches" widget (IDPB). POST: authenticated reporters file
// a new dispatch from the mobile composer (/desk/dispatch). Dynamic so it never
// hits the DB at build time and degrades gracefully if Payload is unreachable.
export const dynamic = 'force-dynamic'

const ROLES_ALLOWED = ['admin', 'editor', 'reporter']

/** A dispatch body is one short message. Build the minimal Lexical editorState
 *  the richText field expects, splitting on blank lines into paragraphs. */
function lexicalFromText(text: string) {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  const children = (paras.length ? paras : [text]).map((p) => ({
    type: 'paragraph',
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr' as const,
    children: [
      { type: 'text', text: p, version: 1, format: 0, style: '', mode: 'normal' as const, detail: 0 },
    ],
  }))
  return { root: { type: 'root', version: 1, format: '', indent: 0, direction: 'ltr' as const, children } }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  const role = (user as { role?: string } | null)?.role
  if (!user || !role || !ROLES_ALLOWED.includes(role)) {
    return NextResponse.json({ error: 'Sign in as newsroom staff to file dispatches.' }, { status: 401 })
  }

  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 })
  }

  const message = String(data.message ?? '').trim()
  if (message.length < 3) return NextResponse.json({ error: 'Dispatch is too short.' }, { status: 400 })
  if (message.length > 280) return NextResponse.json({ error: 'Keep it under 280 characters.' }, { status: 400 })

  const significance = ['normal', 'significant', 'breaking'].includes(String(data.significance))
    ? String(data.significance)
    : 'normal'
  const initials = String(data.initials ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || undefined
  const expiresHours = Number(data.expiresHours)
  const now = new Date()
  const expiresAt =
    Number.isFinite(expiresHours) && expiresHours > 0
      ? new Date(now.getTime() + expiresHours * 3600 * 1000).toISOString()
      : undefined

  try {
    const payload = await getPayload({ config })
    const doc = await payload.create({
      collection: 'live-dispatches',
      // Run as the filing user so access control (isReporterOrAbove) is enforced
      // and the dispatch is attributed to them.
      overrideAccess: false,
      user: { ...user, collection: 'users' },
      data: {
        headline: message,
        body: lexicalFromText(message),
        author: [user.id],
        initials,
        significance,
        publishedAt: now.toISOString(),
        expiresAt,
      },
    })
    return NextResponse.json({ ok: true, id: doc.id })
  } catch {
    return NextResponse.json({ error: 'Could not file the dispatch. Try again.' }, { status: 500 })
  }
}

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
