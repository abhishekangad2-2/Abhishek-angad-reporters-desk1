import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../payload.config'
import { verifyTotpCode } from '../../../../lib/auth/totp'
import { getSessionUser } from '../../../../lib/auth/session'

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req, { allowUnenrolled: true })
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const { code } = await req.json()
  if (!user.totpSecret || !verifyTotpCode(user.totpSecret, code)) {
    return NextResponse.json(
      { error: 'Incorrect code — wait for the next 30-second code and try again.' },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config })
  await payload.update({ collection: 'users', id: user.id, data: { twoFactorEnabled: true } })

  await payload.create({
    collection: 'audit-log',
    data: { actor: user.id, action: 'update', collection: 'users', documentId: user.id },
  })

  return NextResponse.json({ ok: true })
}
