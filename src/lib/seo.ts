// SEO helpers — canonical/absolute URLs and schema.org NewsArticle JSON-LD.
// Used by story pages so search engines (and Google News) get rich, accurate
// structured data. Everything degrades gracefully when fields are missing.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://reporters-desk.org').replace(
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

// Collapse runs of whitespace (including stray double spaces and newlines) to a
// single space and trim the ends.
export function cleanText(s?: string | null): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

const MAX_TITLE_LEN = 70

// Pick a clean <title>/og:title. An editor-entered SEO title wins, EXCEPT when
// it's a keyword-stuffed dump — an over-long string or a long comma-list of
// names/tags — which renders as an unclickable search snippet and a broken
// social card. In that case fall back to the real headline.
export function pickTitle(seoTitle?: string | null, headline?: string | null): string {
  const seo = cleanText(seoTitle)
  const head = cleanText(headline)
  if (!seo) return head
  const commaCount = (seo.match(/,/g) || []).length
  if (seo.length > MAX_TITLE_LEN || commaCount >= 4) return head || seo
  return seo
}

const MAX_DESC_LEN = 160

// Meta/og description clamped to ~160 chars at a word boundary so search engines
// don't truncate mid-sentence. Editor SEO description wins, else the strap.
export function pickDescription(seoDescription?: string | null, strap?: string | null): string {
  const raw = cleanText(seoDescription) || cleanText(strap)
  if (raw.length <= MAX_DESC_LEN) return raw
  const clipped = raw.slice(0, MAX_DESC_LEN - 1)
  const lastSpace = clipped.lastIndexOf(' ')
  return (lastSpace > 60 ? clipped.slice(0, lastSpace) : clipped).replace(/[\s,;:.\-–—]+$/, '') + '…'
}

// Social-card dimensions produced by the /og endpoint.
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

// Hosts whose images we re-encode for social cards (mirrors next.config image
// remotePatterns). Anything else is passed through untouched.
export const OG_PROXY_HOSTS = new Set([
  'cdn.reporters-desk.org',
  'cdn.reportersdesk.abhishekangad.com',
  'storage.googleapis.com',
])

// A hero image straight off the CDN can be >1MB — WhatsApp silently drops link
// previews above ~300KB, and a portrait hero gets awkwardly cropped by social
// scrapers. Route it through /og, which returns a 1200x630 JPEG well under that
// limit. Non-proxyable hosts fall back to the raw absolute URL.
export function ogImageUrl(heroUrl?: string | null): string | undefined {
  const abs = absoluteUrl(heroUrl)
  if (!abs) return undefined
  try {
    const u = new URL(abs)
    if (u.protocol === 'https:' && OG_PROXY_HOSTS.has(u.hostname)) {
      return `${SITE_URL}/og?src=${encodeURIComponent(abs)}`
    }
  } catch {
    /* fall through to raw */
  }
  return abs
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
  const headline: string = pickTitle(seo.title, story?.headline)
  const description: string = pickDescription(seo.description, story?.strap)
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
