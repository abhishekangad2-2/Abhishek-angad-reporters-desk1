// Builds a deliberately boring, fully static HTML snapshot of recently
// published stories. This is NOT a static export of the Next.js app —
// the real app needs live API routes (payments, polls, auth) that can't
// run as static files. This mirror exists for one purpose only: if the
// main app is ever knocked offline or pressured, the journalism itself
// is still reachable at a separate URL, even in the plainest possible form.
import fs from 'node:fs/promises'
import path from 'node:path'

const PAYLOAD_API_URL = process.env.PAYLOAD_API_URL
const OUT_DIR = path.resolve('mirror')

async function main() {
  const res = await fetch(
    `${PAYLOAD_API_URL}/api/articles?where[_status][equals]=published&sort=-publishedAt&limit=100&depth=1`,
  )
  const { docs: articles } = await res.json()

  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(path.join(OUT_DIR, 'index.html'), renderIndex(articles))

  for (const article of articles) {
    const dir = path.join(OUT_DIR, 'stories', article.slug)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'index.html'), renderArticle(article))
  }

  console.log(`Static mirror built: ${articles.length} stories in ${OUT_DIR}`)
}

function shell(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — ReportersDesk (mirror)</title>
  <style>
    body { font-family: Georgia, serif; max-width: 680px; margin: 2rem auto; padding: 0 1rem; color: #14171c; }
    h1, h2 { font-family: Georgia, serif; }
    .notice { font-family: monospace; font-size: 0.8rem; color: #4a4f57; border: 1px solid #ccc; padding: 0.75rem; margin-bottom: 2rem; }
    a { color: #b43d2a; }
  </style>
</head>
<body>
  <p class="notice">
    This is the resilience mirror — a plain, static fallback of ReportersDesk's published
    stories. The full site, with its interactive features, is at reportersdesk.in.
  </p>
  ${body}
</body>
</html>`
}

function renderIndex(articles) {
  const items = articles
    .map(
      (a) =>
        `<li><a href="/stories/${a.slug}/">${escapeHtml(a.headline)}</a><br><small>${escapeHtml(a.strap ?? '')}</small></li>`,
    )
    .join('\n')
  return shell('ReportersDesk', `<h1>ReportersDesk</h1><ul>${items}</ul>`)
}

function renderArticle(article) {
  const bodyText = (article.layout ?? [])
    .filter((b) => b.blockType === 'richText')
    .map((b) => b.content?.root?.children?.map((c) => c.text ?? '').join(' ') ?? '')
    .join('</p><p>')

  return shell(
    article.headline,
    `<h1>${escapeHtml(article.headline)}</h1>
     <p><em>${escapeHtml(article.strap ?? '')}</em></p>
     <p>${bodyText}</p>`,
  )
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
