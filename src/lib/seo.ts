// SEO helpers — canonical/absolute URLs and schema.org NewsArticle JSON-LD.
// Used by story pages so search engines (and Google News) get rich, accurate
// structured data. Everything degrades gracefully when fields are missing.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://reportersdesk.abhishekangad.com').replace(
  /\/$/,
  '',
)

const PUBLISHER_NAME = 'ReportersDesk'

// Turn a possibly-relative path into an absolute URL. Media may already be an
// absolute CDN URL — pass those through untouched.
export function absoluteUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function authorNames(author: unknown): string[] {
  const list = Array.isArray(author) ? author : author ? [author] : []
  return list
    .map((a: any) => {
      if (!a || typeof a !== 'object') return null
      const full = [a.firstName, a.lastName].filter(Boolean).join(' ').trim()
      return full || a.name || a.email || null
    })
    .filter((n): n is string => Boolean(n))
}

// Build a schema.org NewsArticle object for a published story. `url` is the
// canonical absolute URL of the story page.
export function buildArticleJsonLd(story: any, opts: { url: string; sectionName?: string }): Record<string, unknown> {
  const seo = story?.seoMeta || {}
  const headline: string = seo.title || story?.headline || ''
  const description: string = seo.description || story?.strap || ''
  const image = absoluteUrl(
    story?.heroMedia && typeof story.heroMedia === 'object' ? story.heroMedia.url : undefined,
  )
  const authors = authorNames(story?.author)

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    url: opts.url,
    publisher: {
      '@type': 'Organization',
      name: PUBLISHER_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/icon.png') },
    },
  }

  if (image) jsonLd.image = [image]
  if (story?.publishedAt) jsonLd.datePublished = new Date(story.publishedAt).toISOString()
  if (story?.updatedAt) jsonLd.dateModified = new Date(story.updatedAt).toISOString()
  if (authors.length) jsonLd.author = authors.map((name) => ({ '@type': 'Person', name }))
  if (opts.sectionName) jsonLd.articleSection = opts.sectionName

  return jsonLd
}
