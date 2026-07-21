import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import DispatchComposer from '@/components/DispatchComposer'
import './dispatch.css'

// Mobile-first dispatch composer. A reporter signs in on their phone and files
// a live dispatch straight into the site-wide widget — no CMS. Reporter+ only;
// the POST it submits to (/api/dispatches) re-checks auth via the rd_session
// cookie, so this page gate and the write gate are independent.
export const dynamic = 'force-dynamic'

type StaffUser = {
  id: string
  role?: string
  name?: string
  email?: string
  firstName?: string
  lastName?: string
}

function initialsFor(u: StaffUser): string {
  const fromNames = ((u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')).toUpperCase()
  if (fromNames) return fromNames
  if (u.name) {
    return u.name
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .slice(0, 3)
      .toUpperCase()
  }
  return (u.email ?? 'RD').slice(0, 2).toUpperCase()
}

export default async function DispatchPage() {
  const payload = await getPayload({ config })
  let user: StaffUser | null = null
  try {
    user = (await payload.auth({ headers: await headers() })).user as StaffUser | null
  } catch {
    user = null
  }
  if (!user || !['admin', 'editor', 'reporter'].includes(user.role ?? '')) {
    redirect('/admin-login')
  }

  const recent = await payload
    .find({ collection: 'live-dispatches', sort: '-publishedAt', limit: 5, depth: 0 })
    .then((r) =>
      r.docs.map((d: Record<string, unknown>) => ({
        id: String(d.id),
        headline: String(d.headline ?? ''),
        significance: (d.significance as string) ?? 'normal',
        publishedAt: (d.publishedAt as string) ?? (d.createdAt as string),
      })),
    )
    .catch(() => [])

  return (
    <DispatchComposer
      initials={initialsFor(user)}
      userName={user.name || user.email || 'Reporter'}
      recent={recent}
    />
  )
}
