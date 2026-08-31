import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

// One-off: set a story's GalleryAudioVideo block to a given list of media ids.
// Token-gated (SEED_TOKEN). Captions come from each image's alt text.
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = process.env.SEED_TOKEN
  if (!token || req.headers.get('x-seed-token') !== token) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }
  const slug = String(body.slug || '')
  const imageIds: any[] = Array.isArray(body.imageIds) ? body.imageIds : []
  if (!slug || !imageIds.length) return NextResponse.json({ error: 'slug + imageIds required' }, { status: 400 })

  try {
    const payload = await getPayload({ config })
    const res = await payload.find({ collection: 'stories', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    const story: any = res.docs[0]
    if (!story) return NextResponse.json({ error: 'story not found' }, { status: 404 })

    const layout: any[] = Array.isArray(story.layout) ? story.layout : []
    let found = false
    const newLayout = layout.map((b: any) => {
      if (b.blockType === 'GalleryAudioVideo') {
        found = true
        return { ...b, gallery: imageIds.map((id) => ({ image: id })) }
      }
      return b
    })
    if (!found) {
      // No gallery block yet — append one.
      newLayout.push({ blockType: 'GalleryAudioVideo', gallery: imageIds.map((id) => ({ image: id })) })
    }

    await payload.update({ collection: 'stories', id: story.id, data: { layout: newLayout }, overrideAccess: true, depth: 0 })
    return NextResponse.json({ ok: true, galleryCount: imageIds.length, appended: !found })
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message || e) }, { status: 500 })
  }
}
