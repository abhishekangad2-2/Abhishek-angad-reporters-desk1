import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { clientIpFromXff } from './lib/clientIp'
import { isLocale, LOCALE_COOKIE } from './lib/i18n'

// Middleware does two independent jobs, gated so each only touches its own paths:
//  1. /cms admin: IP allowlist + 2FA-session gate + no-store (unchanged).
//  2. Archive host (reporters-desk.abhishekangad.com): serve the /archive pages
//     at the root, and 301 any leftover publication deep-links to the canonical
//     reporters-desk.org. Every other request passes straight through.
const SESSION_COOKIE = 'rd_session'
const NO_STORE = 'no-store, no-cache, must-revalidate, proxy-revalidate'
// Primary archive host (used for outbound links/redirects). The un-hyphenated
// form is kept as a served alias so old links don't break during the DNS move.
const ARCHIVE_HOST = 'reporters-desk.abhishekangad.com'
const ARCHIVE_HOSTS = new Set([ARCHIVE_HOST, 'reportersdesk.abhishekangad.com'])
const CANONICAL = 'https://reporters-desk.org'

// LongPress — the book-review imprint, served off this same service once its
// domain mapping is live. Book reviews are ordinary stories filed under the
// 'book-reviews' section; on thelongpress.org they get clean roots
// (thelongpress.org/ → the index, thelongpress.org/<slug> → a review). Paths that
// belong to the shared shell pass straight through untouched.
const LONGPRESS_HOSTS = new Set(['thelongpress.org', 'www.thelongpress.org'])
const LONGPRESS_SECTION = 'book-reviews'
// First segment of these is NOT a review slug — leave it alone on thelongpress.org.
const LONGPRESS_RESERVED = new Set([
  'api', 'admin-login', 'cms', 'desk', 'book-reviews',
  'wire', 'podcast', 'visual-essay', 'support', 'founder', 'archive',
])

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

  // (2) Archive host: clean root URLs. / → archive index; bare slug → archive
  //     entry; old publication paths → canonical. The internal /archive route is
  //     never public here — direct hits redirect to the clean root form.
  if (ARCHIVE_HOSTS.has(host)) {
    if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/admin-login') ||
      pathname.startsWith('/cms')
    ) {
      return NextResponse.next()
    }
    if (pathname === '/archive' || pathname.startsWith('/archive/')) {
      const rest = pathname.slice('/archive'.length) || '/'
      return NextResponse.redirect(new URL(rest, request.url), 301)
    }
    if (pathname === '/') {
      // clone() preserves the query (?lang=…) so the archive gets the locale;
      // internal rewrite keeps the URL as "/" and middleware does not re-run.
      const url = request.nextUrl.clone()
      url.pathname = '/archive'
      return NextResponse.rewrite(url)
    }
    const parts = pathname.split('/').filter(Boolean)
    // Deep publication links (a known section, or any multi-segment path) → canonical.
    if (parts.length > 1 || PUB_PREFIXES.has(parts[0])) {
      return NextResponse.redirect(CANONICAL + pathname, 301)
    }
    // Single bare segment → the archive entry, served at the clean URL (query kept).
    const url = request.nextUrl.clone()
    url.pathname = `/archive/${parts[0]}`
    return NextResponse.rewrite(url)
  }

  // (2b) LongPress host: book reviews served at clean roots.
  if (LONGPRESS_HOSTS.has(host)) {
    const parts = pathname.split('/').filter(Boolean)
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = `/${LONGPRESS_SECTION}`
      return NextResponse.rewrite(url)
    }
    // A bare slug that isn't a reserved shell path → the review under book-reviews.
    if (parts.length === 1 && !LONGPRESS_RESERVED.has(parts[0])) {
      const url = request.nextUrl.clone()
      url.pathname = `/${LONGPRESS_SECTION}/${parts[0]}`
      return NextResponse.rewrite(url)
    }
    // Everything else (/book-reviews/<slug>, /api, /cms, shell paths) is untouched.
    return NextResponse.next()
  }

  // (3) Publication host (reporters-desk.org): the archive lives on its own
  //     subdomain — bounce any /archive path there. Everything else untouched.
  if (pathname === '/archive' || pathname.startsWith('/archive/')) {
    const rest = pathname.slice('/archive'.length) || '/'
    return NextResponse.redirect(`https://${ARCHIVE_HOST}${rest}`, 301)
  }

  // (4) ?lang=<locale> → sync the rd_lang cookie so the shared site chrome
  //     (masthead nav, byline, footer), which reads the cookie, matches the
  //     language even on a fresh link that has no cookie yet.
  const lang = request.nextUrl.searchParams.get('lang')
  if (lang && isLocale(lang) && request.cookies.get(LOCALE_COOKIE)?.value !== lang) {
    request.cookies.set(LOCALE_COOKIE, lang)
    const res = NextResponse.next({ request: { headers: request.headers } })
    res.cookies.set(LOCALE_COOKIE, lang, { path: '/', maxAge: 31536000, sameSite: 'lax' })
    return res
  }
  return NextResponse.next()
}

export const config = {
  // Run on all pages, but skip Next internals and static files (anything with a
  // file extension). Broad enough for host routing; excludes assets for perf.
  matcher: ['/((?!_next/|.*\\.[\\w]+$).*)'],
}
