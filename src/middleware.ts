import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Fresh admin middleware. Runs only for /cms (see matcher). Three jobs:
//  1. Optional IP allowlist (env ADMIN_IP_ALLOWLIST, comma-separated; fail-open).
//  2. Require a valid 2FA session cookie, else redirect to the custom login.
//  3. Mark every admin response no-store so the browser never pins a stale
//     build — this is what fixes the post-deploy "This page couldn't load"
//     (Next router fetching a dead deployment's RSC payload).
const SESSION_COOKIE = 'rd_session'
const NO_STORE = 'no-store, no-cache, must-revalidate, proxy-revalidate'

function noStore(res: NextResponse): NextResponse {
  res.headers.set('Cache-Control', NO_STORE)
  res.headers.set('Pragma', 'no-cache')
  res.headers.set('Expires', '0')
  return res
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const allow = (process.env.ADMIN_IP_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (allow.length > 0) {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    if (!ip || !allow.some((a) => ip === a || ip.startsWith(a))) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) {
    return noStore(NextResponse.redirect(new URL('/admin-login', request.url)))
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.PAYLOAD_SECRET))
    // Authenticated — pass through, but never cache the admin.
    return noStore(NextResponse.next())
  } catch {
    const res = noStore(NextResponse.redirect(new URL('/admin-login', request.url)))
    res.cookies.delete(SESSION_COOKIE)
    return res
  }
}

export const config = {
  // Bare /cms and everything under it.
  matcher: ['/cms', '/cms/:path*'],
}
