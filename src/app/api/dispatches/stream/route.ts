import { getPayload } from 'payload'
import config from '@/payload.config'

// IDPB realtime — Server-Sent Events stream of live dispatches. The client
// (LiveDispatches) consumes this via EventSource and falls back to /api/dispatches
// polling if the stream errors. Server polls the DB every ~10s and pushes the
// current feed; the browser only re-renders when the payload changes.
export const dynamic = 'force-dynamic'
export const revalidate = 0

function relTime(iso?: string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

async function readFeed() {
  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const res = await payload.find({
      collection: 'live-dispatches',
      where: {
        publishedAt: { less_than_equal: now },
        or: [{ expiresAt: { greater_than: now } }, { expiresAt: { exists: false } }],
      },
      sort: '-publishedAt',
      depth: 1,
      limit: 6,
    })
    return res.docs.map((d: any) => ({
      id: d.id,
      initials: d.initials || (d.author?.[0]?.firstName?.[0] ?? '') + (d.author?.[0]?.lastName?.[0] ?? '') || 'RD',
      text: d.headline ?? '',
      flag: d.significance === 'breaking' ? 'Breaking' : d.significance === 'significant' ? 'Significant' : '',
      postedAt: d.publishedAt,
      time: relTime(d.publishedAt),
    }))
  } catch {
    return []
  }
}

export async function GET() {
  const encoder = new TextEncoder()
  let timer: ReturnType<typeof setInterval> | null = null
  let last = ''

  const stream = new ReadableStream({
    async start(controller) {
      const push = async () => {
        const feed = await readFeed()
        const json = JSON.stringify({ dispatches: feed })
        if (json !== last) {
          last = json
          try {
            controller.enqueue(encoder.encode(`data: ${json}\n\n`))
          } catch {
            /* closed */
          }
        }
      }
      await push()
      timer = setInterval(push, 10_000)
    },
    cancel() {
      if (timer) clearInterval(timer)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
