import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { unsubToken } from '@/lib/newsletterToken'

export const dynamic = 'force-dynamic'

function page(message: string, status = 200) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reporters Desk</title>
  <style>body{font-family:Georgia,serif;background:#f7f5f0;color:#1a1a18;display:grid;place-items:center;min-height:100vh;margin:0}
  .c{max-width:440px;text-align:center;padding:2rem}h1{font-size:1.5rem}a{color:#b43d2a}</style></head>
  <body><div class="c"><h1>${message}</h1><p><a href="https://reporters-desk.org">← Back to Reporters Desk</a></p></div></body></html>`
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

async function unsubscribe(email: string, token: string) {
  if (!email || !token || unsubToken(email) !== token) return page('This unsubscribe link is invalid or expired.', 400)
  try {
    const payload = await getPayload({ config })
    const found = await payload.find({
      collection: 'newsletter-subscribers',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
    })
    if (found.docs[0]) {
      await payload.update({
        collection: 'newsletter-subscribers',
        id: found.docs[0].id,
        data: { status: 'unsubscribed' },
        overrideAccess: true,
      })
    }
    return page('You have been unsubscribed. You will no longer receive our newsletter.')
  } catch {
    return page('Something went wrong. Please email desk@reporters-desk.org to unsubscribe.', 500)
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  return unsubscribe(url.searchParams.get('e') || '', url.searchParams.get('t') || '')
}

// One-click unsubscribe (RFC 8058) — mail clients POST here.
export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  return unsubscribe(url.searchParams.get('e') || '', url.searchParams.get('t') || '')
}
