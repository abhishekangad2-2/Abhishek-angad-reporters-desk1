import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../payload.config'
import { generateTotpSecret, generateEnrollmentQr, generateBackupCodes, hashBackupCode } from '../../../../lib/auth/totp'
import { getSessionUser } from '../../../../lib/auth/session'

// Called once, immediately after a brand-new account's first password-only
// login. The caller is authenticated (password verified) but twoFactorEnabled
// is still false, which is exactly why `allowUnenrolled` exists.
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req, { allowUnenrolled: true })
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
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
