import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPayload } from 'payload'
import config from '../../../../payload.config'
import { generateTotpSecret, generateEnrollmentQr, generateBackupCodes, hashBackupCode } from '../../../../lib/auth/totp'
import { getSessionUser } from '../../../../lib/auth/session'

const PENDING_2FA_SECRET = process.env.PENDING_2FA_SECRET!

// Called once, immediately after a brand-new account's first password-only
// login. The caller is authenticated (password verified) but twoFactorEnabled
// is still false, which is exactly why `allowUnenrolled` exists.
export async function POST(req: NextRequest) {
  const { pendingToken } = await req.json()

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
    // Fallback: session-based enrollment (for future admin-panel UI)
    const user = await getSessionUser(req, { allowUnenrolled: true })
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    userId = user.id
  }

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId })
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: 'Two-factor is already enrolled on this account.' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const secret = generateTotpSecret()
  const qrDataUrl = await generateEnrollmentQr(user.email, secret)
  const backupCodes = generateBackupCodes()
  const hashedCodes = await Promise.all(backupCodes.map((c) => hashBackupCode(c)))

  await payload.update({
    collection: 'users',
    id: user.id,
    data: {
      totpSecret: secret,
      backupCodes: hashedCodes.map((codeHash) => ({ codeHash })),
      // twoFactorEnabled stays false until /api/auth/confirm-enrollment
      // verifies one real code from the freshly scanned app.
    },
  })

  // backupCodes are returned in plaintext exactly once, here. The CMS UI
  // must show these to the user immediately with a "save these now" prompt —
  // there is no way to retrieve them again after this response.
  return NextResponse.json({ qrDataUrl, backupCodes })
}
