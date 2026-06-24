import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPayload } from 'payload'
import config from '../../payload.config'

const SESSION_COOKIE = 'rd_session'

/**
 * `allowUnenrolled` exists for exactly one caller: the 2FA enrollment route
 * itself, which has to read the logged-in user *before* twoFactorEnabled is
 * true. Every other route should call this with no options, so a session
 * that hasn't finished step two is treated as not logged in at all.
 */
export async function getSessionUser(req: NextRequest, opts: { allowUnenrolled?: boolean } = {}) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.PAYLOAD_SECRET!) as { userId: string }
    const payload = await getPayload({ config })
    const user = await payload.findByID({ collection: 'users', id: decoded.userId })
    if (!user.twoFactorEnabled && !opts.allowUnenrolled) return null
    return user
  } catch {
    return null
  }
}

export { SESSION_COOKIE }
