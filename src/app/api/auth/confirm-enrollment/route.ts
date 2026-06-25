import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { getPayload, getFieldsToSign } from 'payload'
import config from '../../../../payload.config'
import { verifyTotpCode } from '../../../../lib/auth/totp'
import { getSessionUser, SESSION_COOKIE } from '../../../../lib/auth/session'

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

  // The code was just verified, so log the user straight in — no need to make
  // them enter a second code immediately after enrolling. Same session cookies
  // that verify-2fa issues: rd_session (middleware gate) + payload-token
  // (Payload admin auth, signed with Payload's derived JWT secret).
  const sessionToken = jwt.sign({ userId: user.id, role: user.role }, process.env.PAYLOAD_SECRET!, {
    expiresIn: '2h',
  })
  const usersConfig = payload.collections['users'].config
  const tokenExpiration = usersConfig.auth?.tokenExpiration ?? 60 * 60 * 2
  const fieldsToSign = getFieldsToSign({ collectionConfig: usersConfig, email: user.email, user })
  const payloadJwtSecret = crypto
    .createHash('sha256')
    .update(process.env.PAYLOAD_SECRET!)
    .digest('hex')
    .slice(0, 32)
  const payloadToken = jwt.sign(fieldsToSign, payloadJwtSecret, { expiresIn: tokenExpiration })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 2,
    path: '/',
  })
  res.cookies.set('payload-token', payloadToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: tokenExpiration,
    path: '/',
  })
  return res
}
