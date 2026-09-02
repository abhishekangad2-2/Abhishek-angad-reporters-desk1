import { NextRequest, NextResponse } from 'next/server'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@/payload.config'

// One-click "new book review". Payload's create view can't prefill a field via
// URL, so this creates a draft already filed under the Book Reviews section
// (with the signed-in editor as author) and redirects to its edit page. Reached
// by POST from the LongPressCTA button in the Stories admin — POST (not GET) so
// admin link-prefetch can't spawn stray drafts. GET just bounces to the plain
// create form.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/cms/collections/stories/create', req.url))
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  type StaffUser = { id: string | number; role?: string }
  let user: StaffUser | null = null
  try {
    user = ((await payload.auth({ headers: await nextHeaders() })).user as StaffUser | null) ?? null
  } catch {
    user = null
  }
  if (!user || !['admin', 'editor', 'reporter'].includes(user.role ?? '')) {
    return NextResponse.redirect(new URL('/admin-login?next=/cms/collections/stories', req.url))
  }

  try {
    const sec = await payload.find({
      collection: 'sections',
      where: { slug: { equals: 'book-reviews' } },
      limit: 1,
      depth: 0,
    })
    const section = sec.docs[0] as { id: string | number } | undefined
    if (!section) {
      return NextResponse.redirect(new URL('/cms/collections/stories/create', req.url))
    }

    const doc = await payload.create({
      collection: 'stories',
      data: {
        headline: 'Untitled book review',
        section: section.id,
        author: [user.id],
        status: 'draft',
      } as Record<string, unknown>,
      overrideAccess: true,
    })

    return NextResponse.redirect(new URL(`/cms/collections/stories/${doc.id}`, req.url), 303)
  } catch {
    // If anything goes wrong, fall back to the normal create form.
    return NextResponse.redirect(new URL('/cms/collections/stories/create', req.url))
  }
}
