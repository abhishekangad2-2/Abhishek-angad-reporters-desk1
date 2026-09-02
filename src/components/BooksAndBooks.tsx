import { getPayload } from 'payload'
import config from '@/payload.config'

// "Books & Books" — a homepage band on Reporters Desk that surfaces the latest
// book review published under the LongPress imprint. The logic mirrors the rest
// of the site: publish a story in the CMS (Stories → Book Reviews section) and
// its headline + strap appear here automatically; the whole band links out to
// that review on thelongpress.org. Falls back to a generic promo when no review
// has been published yet, so the band is always safe to render.
export default async function BooksAndBooks() {
  let review: { headline?: string; strap?: string; slug?: string } | null = null
  try {
    const payload = await getPayload({ config })
    const sec = await payload.find({
      collection: 'sections',
      where: { slug: { equals: 'book-reviews' } },
      limit: 1,
      depth: 0,
    })
    const section = sec.docs[0] as { id: string | number } | undefined
    if (section) {
      const res = await payload.find({
        collection: 'stories',
        where: { section: { equals: section.id }, status: { equals: 'published' } },
        sort: '-publishedAt',
        limit: 1,
        depth: 0,
      })
      review = (res.docs[0] as typeof review) ?? null
    }
  } catch {
    review = null
  }

  const href = review?.slug ? `https://thelongpress.org/${review.slug}` : 'https://thelongpress.org'
  const headline = review?.headline ?? 'Book reviews — now at The Long Press'
  const strap =
    review?.strap ?? 'Long-form reviews of the books worth arguing about — a Reporters Desk imprint.'

  return (
    <aside className="books-books" aria-label="Books & Books">
      <a className="bb-inner" href={href}>
        <span className="bb-kicker">
          <span className="bb-dot" aria-hidden /> Books &amp; Books · The Long Press
        </span>
        <h2 className="bb-title">{headline}</h2>
        {strap && <p className="bb-dek">{strap}</p>}
        <span className="bb-cta">Read on thelongpress.org →</span>
      </a>
    </aside>
  )
}
