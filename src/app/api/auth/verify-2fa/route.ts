import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPayload } from 'payload'
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

  const sessionToken = jwt.sign({ userId: user.id, role: user.role }, process.env.PAYLOAD_SECRET!, {
    expiresIn: '2h',
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 2,
    path: '/',
  })
  return res
}
