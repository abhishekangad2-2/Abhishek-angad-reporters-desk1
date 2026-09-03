import sharp from 'sharp'
import { OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, OG_PROXY_HOSTS } from '@/lib/seo'

// Social-card image endpoint. Fetches a hero image from our own CDN and returns
// a 1200x630 JPEG under ~150KB — small enough that WhatsApp (which drops link
// previews above ~300KB) renders a thumbnail, and cropped to landscape so
// portrait heroes don't get mangled by social scrapers. Cached immutably: the
// (src → rendered card) mapping never changes, so the CDN/browser serve it once.
export const runtime = 'nodejs'

// Only re-encode images from hosts we control — never an arbitrary URL (SSRF).
function isAllowed(u: URL): boolean {
  return u.protocol === 'https:' && OG_PROXY_HOSTS.has(u.hostname)
}

export async function GET(request: Request): Promise<Response> {
  const src = new URL(request.url).searchParams.get('src')
  if (!src) return new Response('missing src', { status: 400 })

  let target: URL
  try {
    target = new URL(src)
  } catch {
    return new Response('bad src', { status: 400 })
  }
  if (!isAllowed(target)) return new Response('forbidden host', { status: 403 })

  try {
    const upstream = await fetch(target, { signal: AbortSignal.timeout(8000) })
    if (!upstream.ok) return new Response('upstream error', { status: 502 })

    const input = Buffer.from(await upstream.arrayBuffer())
    const out = await sharp(input)
      .resize(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer()

    return new Response(new Uint8Array(out), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('render error', { status: 500 })
  }
}
