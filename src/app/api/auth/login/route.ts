import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPayload } from 'payload'
import config from '../../../../payload.config'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const PENDING_2FA_SECRET = process.env.PENDING_2FA_SECRET!
const PENDING_2FA_TTL = '5m'

export async function POST(req: NextRequest) {
  // 5 attempts per IP per 15 minutes
  if (!checkRateLimit(`login:${getClientIp(req)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 })
  }

  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  // payload.login() verifies the password and applies Payload's own
  // lockout/rate-limit rules, but we deliberately don't use the session
  // token it would normally issue — that only happens after step two.
  let user: any
  try {
    const result = await payload.login({ collection: 'users', data: { email, password } })
    user = result.user
  } catch {
    // Identical response whether the email doesn't exist or the password
    // is wrong — never let a caller distinguish the two.
    await logFailedLogin(payload, email, req)
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  // Whether the account still needs to enrol 2FA or already has it, the
  // password is now verified, so we issue the same short-lived pending token.
  // The client uses it to drive either enrollment (enroll-2fa +
  // confirm-enrollment) or the TOTP challenge (verify-2fa) — no second
  // password round-trip, and no dead end for a brand-new account.
  const pendingToken = jwt.sign({ userId: user.id, step: 'pending-2fa' }, PENDING_2FA_SECRET, {
    expiresIn: PENDING_2FA_TTL,
  })

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ requiresEnrollment: true, pendingToken })
  }

  return NextResponse.json({ pendingToken, requiresTotp: true })
}

async function logFailedLogin(payload: any, email: string, req: NextRequest) {
  await payload.create({
    collection: 'audit-logs',
    data: {
      action: 'login-failed',
      collectionName: 'users',
      documentId: email,
      details: { ipAddress: req.headers.get('x-forwarded-for') ?? undefined },
    },
  })
}
