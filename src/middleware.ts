import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const SESSION_COOKIE = 'rd_session'
const PUBLIC_PATHS = ['/api/auth', '/admin-login', '/']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow unauthenticated access to public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Protect /admin: require valid 2FA session
  if (pathname.startsWith('/admin') || pathname.startsWith('/(payload)')) {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value

    if (!sessionToken) {
      // No session — redirect to custom 2FA login
      return NextResponse.redirect(new URL('/admin-login', request.url))
    }

    // Verify session token is valid and signed with PAYLOAD_SECRET
    try {
      jwt.verify(sessionToken, process.env.PAYLOAD_SECRET!)
      return NextResponse.next()
    } catch {
      // Invalid/expired token — clear and redirect to login
      const response = NextResponse.redirect(new URL('/admin-login', request.url))
      response.cookies.delete(SESSION_COOKIE)
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protect admin routes
    '/admin/:path*',
    '/(payload)/:path*',
    // Allow everything else to pass through
  ],
}
