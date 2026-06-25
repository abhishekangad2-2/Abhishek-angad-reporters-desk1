import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPayload } from 'payload'
import config from '../../../../payload.config'
import { verifyTotpCode } from '../../../../lib/auth/totp'
import { getSessionUser } from '../../../../lib/auth/session'

const PENDING_2FA_SECRET = process.env.PENDING_2FA_SECRET!

export async function POST(req: NextRequest) {
  const { pendingToken, code } = await req.json()

  // Accept either an existing session or a fresh pendingToken from /api/auth/login
  let userId: string
  if (pendingToken) {
    try {
      const decoded = jwt.verify(pendingToken, PENDING_2FA_SECRET) as { userId: string; step: string }
      if (decoded.step !== 'pending-2fa') {
        return NextResponse.json({ error: 'Invalid token.' }, { status: 401 })
      }
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: 'Token expired or invalid.' }, { status: 401 })
    }
  } else {
    // Fallback: session-based confirmation (for future admin-panel UI)
    const user = await getSessionUser(req, { allowUnenrolled: true })
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    userId = user.id
  }

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId })
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  if (!user.totpSecret || !verifyTotpCode(user.totpSecret, code)) {
    return NextResponse.json(
      { error: 'Incorrect code — wait for the next 30-second code and try again.' },
      { status: 400 },
    )
  }

  await payload.update({ collection: 'users', id: user.id, data: { twoFactorEnabled: true } })

  await payload.create({
    collection: 'audit-logs',
    data: { user: user.id, action: 'enroll-2fa', collectionName: 'users', documentId: user.id },
  })

  return NextResponse.json({ ok: true })
}
