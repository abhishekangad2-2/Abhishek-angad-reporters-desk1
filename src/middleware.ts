import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = 'rd_session'

// This middleware only runs for the paths in `config.matcher` below (the
// Payload admin, mounted at /admin). Every request that reaches here must
// carry a valid 2FA session cookie or it is redirected to the custom login.
// NOTE: the matcher deliberately does NOT include /admin-login or /api/auth,
// so those stay reachable without a session.
export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/admin-login', request.url))
  }

  // Verify the session token (signed with the raw PAYLOAD_SECRET in
  // verify-2fa). Middleware runs in the Edge runtime, where `jsonwebtoken`
  // cannot run (no Node crypto) — it would throw on every request and redirect
  // even valid sessions. `jose` works in Edge and is interoperable with the
  // HS256 token.
  try {
    await jwtVerify(sessionToken, new TextEncoder().encode(process.env.PAYLOAD_SECRET))
    return NextResponse.next()
  } catch {
    // Invalid/expired token — clear it and send the user back to login.
    const response = NextResponse.redirect(new URL('/admin-login', request.url))
    response.cookies.delete(SESSION_COOKIE)
    return response
  }
}

export const config = {
  // Match the admin index (/admin) AND everything under it (/admin/...).
  // '/admin/:path*' alone does not match the bare /admin path.
  matcher: ['/admin', '/admin/:path*'],
}
