import { NextRequest, NextResponse } from 'next/server'

// Clean admin address: /admin → the Payload CMS at /cms. Unauthenticated
// visitors are then bounced by middleware to the 2FA login. The public site no
// longer advertises an editor-login link, so this is the memorable entry point
// staff type directly.
export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  // Behind Cloud Run, request.url carries the internal host (0.0.0.0:8080) —
  // build the redirect from the forwarded headers so it lands on the public
  // domain instead.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (!host) return NextResponse.redirect(new URL('/cms', request.url))
  return NextResponse.redirect(`${proto}://${host}/cms`)
}
