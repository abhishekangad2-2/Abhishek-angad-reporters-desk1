import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { clientIpFromXff } from './lib/clientIp'

// Middleware does two independent jobs, gated so each only touches its own paths:
//  1. /cms admin: IP allowlist + 2FA-session gate + no-store (unchanged).
//  2. Archive host (reportersdesk.abhishekangad.com): serve the /archive pages
//     at the root, and 301 any leftover publication deep-links to the canonical
//     reporters-desk.org. Every other request passes straight through.
const SESSION_COOKIE = 'rd_session'
const NO_STORE = 'no-store, no-cache, must-revalidate, proxy-revalidate'
const ARCHIVE_HOST = 'reportersdesk.abhishekangad.com'
const CANONICAL = 'https://reporters-desk.org'

// First path segment of these → an old publication URL, redirect to canonical.
const PUB_PREFIXES = new Set([
  'investigative-journalism', 'ground-reportage', 'data-journalism', 'analysis',
  'policy-and-people', 'accountability-journalism', 'behind-the-process',
  'visual-and-audio-investigations', 'founder', 'desk',
])

function noStore(res: NextResponse): NextResponse {
  res.headers.set('Cache-Control', NO_STORE)
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')
  return res
}

async function cmsGate(request: NextRequest): Promise<NextResponse> {
  const allow = (process.env.ADMIN_IP_ALLOWLIST || '')
    .split(',').map((s) => s.trim()).filter(Boolean)
  if (allow.length > 0) {
    const ip = clientIpFromXff(request.headers.get('x-forwarded-for'))
    if (!ip || ip === 'unknown' || !allow.some((a) => ip === a || ip.startsWith(a))) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return noStore(NextResponse.redirect(new URL('/admin-login', request.url)))
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.PAYLOAD_SECRET))
    return noStore(NextResponse.next())
  } catch {
    const res = noStore(NextResponse.redirect(new URL('/admin-login', request.url)))
    res.cookies.delete(SESSION_COOKIE)
    return res
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const host = (request.headers.get('host') || '').toLowerCase()

  // (1) Admin gate — applies on any host, /cms only.
  if (pathname === '/cms' || pathname.startsWith('/cms/')) {
    return cmsGate(request)
  }

  // (2) Archive host: root → archive index; bare slug → archive entry; old
  //     publication paths → canonical. Admin/API/archive routes pass through.
  if (host === ARCHIVE_HOST) {
    if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/archive') ||
      pathname.startsWith('/admin-login') ||
      pathname.startsWith('/cms')
    ) {
      return NextResponse.next()
    }
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/archive', request.url))
    }
    const parts = pathname.split('/').filter(Boolean)
    // Deep publication links (a known section, or any multi-segment path) → canonical.
    if (parts.length > 1 || PUB_PREFIXES.has(parts[0])) {
      return NextResponse.redirect(CANONICAL + pathname, 301)
    }
    // Single bare segment → treat as an archive entry slug.
    return NextResponse.rewrite(new URL(`/archive/${parts[0]}`, request.url))
  }

  // (3) Everything else (the publication on reporters-desk.org) — untouched.
  return NextResponse.next()
}

export const config = {
  // Run on all pages, but skip Next internals and static files (anything with a
  // file extension). Broad enough for host routing; excludes assets for perf.
  matcher: ['/((?!_next/|.*\\.[\\w]+$).*)'],
}
