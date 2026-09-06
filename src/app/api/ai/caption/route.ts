import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

// #1 AI caption + optimal-crop suggestions. Uses Google Cloud Vision
// (LABEL_DETECTION + CROP_HINTS) when GOOGLE_CLOUD_VISION_API_KEY is set;
// otherwise returns a graceful "not configured" response so the UI degrades
// cleanly. POST { imageUrl } -> { caption, focalPoint, configured }.
//
// This calls a paid external API, so it is gated: only an authenticated CMS
// user may invoke it (it is an editor authoring tool), and each caller is
// rate-limited, so it can't be looped by an anonymous client to burn quota.
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  // 30 caption requests per authoring session per 10 minutes.
  if (!checkRateLimit(`ai-caption:${user.id}:${getClientIp(req)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 })
  }

  const key = process.env.GOOGLE_CLOUD_VISION_API_KEY
  let imageUrl = ''
  try {
    imageUrl = String((await req.json())?.imageUrl || '')
  } catch {}
  if (!key) {
    return NextResponse.json({
      configured: false,
      caption: null,
      focalPoint: null,
      note: 'Set GOOGLE_CLOUD_VISION_API_KEY to enable AI caption + crop suggestions.',
    })
  }
  if (!imageUrl) return NextResponse.json({ configured: true, caption: null, focalPoint: null })
  try {
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { source: { imageUri: imageUrl } },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 6 },
              { type: 'CROP_HINTS' },
              { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
            ],
          },
        ],
      }),
    })
    const data = await res.json()
    const r = data?.responses?.[0] ?? {}
    const labels = (r.labelAnnotations ?? []).map((l: any) => l.description).filter(Boolean)
    const caption = labels.length ? labels.slice(0, 4).join(', ') : null
    // crop hint vertices → normalised focal point (centre of first hint box)
    const verts = r.cropHintsAnnotation?.cropHints?.[0]?.boundingPoly?.vertices ?? []
    let focalPoint: { x: number; y: number } | null = null
    if (verts.length) {
      const xs = verts.map((v: any) => v.x ?? 0)
      const ys = verts.map((v: any) => v.y ?? 0)
      focalPoint = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 }
    }
    return NextResponse.json({ configured: true, caption, focalPoint, labels })
  } catch {
    return NextResponse.json({ configured: true, caption: null, focalPoint: null, error: 'vision_failed' })
  }
}
