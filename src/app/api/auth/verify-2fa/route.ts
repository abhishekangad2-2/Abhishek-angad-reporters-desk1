import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { getPayload, getFieldsToSign } from 'payload'
import config from '../../../../payload.config'
import { verifyTotpCode, verifyBackupCode } from '../../../../lib/auth/totp'
import { SESSION_COOKIE } from '../../../../lib/auth/session'

const PENDING_2FA_SECRET = process.env.PENDING_2FA_SECRET!

export async function POST(req: NextRequest) {
  const { pendingToken, code } = await req.json()
  if (!pendingToken || !code) {
    return NextResponse.json({ error: 'Missing token or code.' }, { status: 400 })
  }

  let decoded: { userId: string; step: string }
  try {
    decoded = jwt.verify(pendingToken, PENDING_2FA_SECRET) as any
  } catch {
    return NextResponse.json({ error: 'That login attempt expired — start again.' }, { status: 401 })
  }
  if (decoded.step !== 'pending-2fa') {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: decoded.userId })

  // Only for accounts that completed 2FA enrollment. A mid-enrollment account
  // (totpSecret written but twoFactorEnabled still false) must finish via
  // confirm-enrollment, not slip through here.
  if (!user.twoFactorEnabled || !user.totpSecret) {
    return NextResponse.json({ error: 'Two-factor is not set up for this account.' }, { status: 400 })
  }

  let verified = verifyTotpCode(user.totpSecret, code)

  // Fall back to a one-time backup code if the live TOTP check fails —
  // each code can only ever verify once.
  if (!verified && user.backupCodes?.length) {
    for (const entry of user.backupCodes) {
      if (!entry.usedAt && (await verifyBackupCode(code, entry.codeHash))) {
        verified = true
        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            backupCodes: user.backupCodes.map((e: any) =>
              e.codeHash === entry.codeHash ? { ...e, usedAt: new Date().toISOString() } : e,
            ),
          },
        })
        break
      }
    }
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  if (!verified) {
    await payload.create({
      collection: 'audit-logs',
      data: { user: user.id, action: 'login-failed', collectionName: 'users', documentId: user.id, details: { ipAddress } },
    })
    return NextResponse.json({ error: 'Incorrect code.' }, { status: 401 })
  }

  await payload.create({
    collection: 'audit-logs',
    data: { user: user.id, action: 'login', collectionName: 'users', documentId: user.id, details: { ipAddress } },
  })

  // 1) Custom session used by middleware.ts to gate /admin server-side.
  const sessionToken = jwt.sign({ userId: user.id, role: user.role }, process.env.PAYLOAD_SECRET!, {
    expiresIn: '2h',
  })

  // 2) A real Payload auth token so the admin panel itself treats the user as
  //    logged in. Payload authenticates requests via its own `payload-token`
  //    cookie; without this the user would clear our gate and then face
  //    Payload's own login screen. We sign exactly the claims Payload signs
  //    (getFieldsToSign), which is valid because Users uses stateless JWTs
  //    (auth.useSessions = false), so no server-side session record is needed.
  const usersConfig = payload.collections['users'].config
  const tokenExpiration = usersConfig.auth?.tokenExpiration ?? 60 * 60 * 2
  const fieldsToSign = getFieldsToSign({
    collectionConfig: usersConfig,
    email: user.email,
    user: { ...user, collection: 'users' },
  })
  // Payload does NOT sign its JWTs with the raw PAYLOAD_SECRET — at init it
  // derives the signing key as sha256(secret) hex, truncated to 32 chars
  // (see payload Payload.init). We must sign with the same derived key or the
  // admin panel rejects the token.
  const payloadJwtSecret = crypto
    .createHash('sha256')
    .update(process.env.PAYLOAD_SECRET!)
    .digest('hex')
    .slice(0, 32)
  const payloadToken = jwt.sign(fieldsToSign, payloadJwtSecret, {
    expiresIn: tokenExpiration,
  })

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
