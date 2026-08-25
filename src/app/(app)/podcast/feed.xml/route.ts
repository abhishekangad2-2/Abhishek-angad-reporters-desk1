import { getEpisodes } from '@/lib/podcasts'

// Podcast RSS 2.0 feed (with iTunes tags) for Apple Podcasts / Spotify.
export const dynamic = 'force-dynamic'

const SITE = 'https://reporters-desk.org'
const FEED_URL = `${SITE}/podcast/feed.xml`
const COVER = `${SITE}/podcast-cover.png` // fallback channel art (see /public)
const AUTHOR = 'Abhishek Angad'
const OWNER_EMAIL = 'desk@reporters-desk.org'

const esc = (s: string) =>
  (s || '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string))

function fmtDuration(sec: number | null): string {
  if (!sec) return ''
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export async function GET() {
  const episodes = await getEpisodes()

  const items = episodes
    .filter((e) => e.audioUrl)
    .map((e) => {
      const url = `${SITE}/podcast/${e.slug}`
      const pub = e.publishDate ? new Date(e.publishDate) : new Date()
      const img = e.coverUrl || COVER
      return `
    <item>
      <title>${esc(e.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="false">${esc(String(e.id))}-${esc(e.slug)}</guid>
      <pubDate>${pub.toUTCString()}</pubDate>
      <description>${esc(e.dek || e.title)}</description>
      <itunes:summary>${esc(e.dek || e.title)}</itunes:summary>
      <itunes:author>${esc(AUTHOR)}</itunes:author>
      ${e.durationSeconds ? `<itunes:duration>${fmtDuration(e.durationSeconds)}</itunes:duration>` : ''}
      <itunes:image href="${esc(img)}" />
      <itunes:explicit>false</itunes:explicit>
      <enclosure url="${esc(e.audioUrl as string)}" length="${e.audioBytes ?? 0}" type="${esc(e.audioMime || 'audio/mpeg')}" />
    </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Reporters Desk Podcast</title>
    <link>${SITE}/podcast</link>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
    <language>en-in</language>
    <description>Interviews, field recordings and audio dispatches from Abhishek Angad and Reporters Desk.</description>
    <itunes:author>${esc(AUTHOR)}</itunes:author>
    <itunes:summary>Interviews, field recordings and audio dispatches from Abhishek Angad and Reporters Desk.</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>false</itunes:explicit>
    <itunes:owner>
      <itunes:name>${esc(AUTHOR)}</itunes:name>
      <itunes:email>${esc(OWNER_EMAIL)}</itunes:email>
    </itunes:owner>
    <itunes:image href="${esc(COVER)}" />
    <itunes:category text="News">
      <itunes:category text="Investigative Journalism" />
    </itunes:category>${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' },
  })
}
