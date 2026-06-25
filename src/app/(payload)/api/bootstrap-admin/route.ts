import { getPayload } from 'payload'
import configPromise from '../../../../payload.config'
import { NextRequest, NextResponse } from 'next/server'

// One-time admin bootstrap. Creating the first user of an auth collection is
// not permitted over the public REST API, and the Payload "create first user"
// screen is unreachable behind our /admin 2FA gate. This endpoint fills that
// gap: it is guarded two ways — it refuses once any user exists, AND it
// requires the PAYLOAD_SECRET as a shared secret — so it cannot be abused. It
// is intended to be removed after the first admin is created.
export async function POST(req: NextRequest) {
  const payload = await getPayload({ config: configPromise })

  const existing = await payload.count({ collection: 'users' })
  if (existing.totalDocs > 0) {
    return NextResponse.json({ error: 'A user already exists; bootstrap is disabled.' }, { status: 409 })
  }

  const { email, password, firstName, lastName, bootstrapSecret } = await req.json()
  if (bootstrapSecret !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: 'Invalid bootstrap secret.' }, { status: 401 })
  }
  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required.' }, { status: 400 })
  }

  const user = await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      role: 'admin',
      firstName: firstName || 'Admin',
      lastName: lastName || 'User',
    },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true, id: user.id, email: user.email })
}
