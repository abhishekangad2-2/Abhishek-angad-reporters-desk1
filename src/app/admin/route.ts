import { NextRequest, NextResponse } from 'next/server'

// Clean admin address: /admin → the Payload CMS at /cms. Unauthenticated
// visitors are then bounced by middleware to the 2FA login. The public site no
// longer advertises an editor-login link, so this is the memorable entry point
// staff type directly.
export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/cms', request.url))
}
