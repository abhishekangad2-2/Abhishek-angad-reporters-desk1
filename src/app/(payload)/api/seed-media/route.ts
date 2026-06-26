import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

// One-off, token-gated seeder: pulls a few public-domain placeholder photos
// from the net and runs them through the real pipeline (Payload Local API →
// GCS bucket → Cloud CDN), then attaches the first as the published story's
// hero. Remove this route once media is populated.
const SEED_TOKEN = 'rd-seed-2026-9c1f'

const IMAGES = [
  { seed: 'himalaya-springs', alt: 'A mountain stream descending through the Himalayan foothills' },
  { seed: 'newsroom-desk', alt: 'A reporter’s desk strewn with documents and a laptop' },
  { seed: 'city-square', alt: 'A crowd gathered in a city square at dusk' },
]

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('secret') !== SEED_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    // ?addblocks=1 — append sample visual-media blocks to the published story's
    // body so the new formats can be verified rendering. Idempotent.
    if (url.searchParams.get('addblocks') === '1') {
      const stories = await payload.find({
        collection: 'stories',
        where: { status: { equals: 'published' } },
        limit: 1,
        depth: 0,
      })
      const story = stories.docs[0]
      if (!story) return NextResponse.json({ error: 'no story' }, { status: 404 })
      const existing = Array.isArray((story as any).layout) ? (story as any).layout : []
      const has = existing.some((b: any) => b?.blockType === 'PullQuote')
      const sample = has
        ? []
        : [
            { blockType: 'PullQuote', quote: 'They walk farther each year for water that used to be at their doorstep.', attribution: 'A villager in the foothills' },
            { blockType: 'StatHighlight', intro: 'The retreat, by the numbers', stats: [{ value: '3', label: 'districts surveyed' }, { value: '40%', label: 'springs dry by May' }, { value: '6 km', label: 'average daily walk for water' }] },
            { blockType: 'Timeline', entries: [{ date: '1998', title: 'First springs recorded drying', detail: 'Seasonal sources begin failing earlier.' }, { date: '2015', title: 'Snowline retreat accelerates', detail: 'Satellite data shows measurable loss.' }, { date: '2026', title: 'Water points relocated', detail: 'Daily walks double in three districts.' }] },
            { blockType: 'FullBleedImage', image: 2, overlayText: 'A once-perennial spring, now dry', credit: 'Lorem Picsum' },
          ]
      const updated = await payload.update({
        collection: 'stories',
        id: story.id,
        data: { layout: [...existing, ...sample] },
      })
      return NextResponse.json({ success: true, appended: sample.length, total: (updated as any).layout?.length })
    }

    const created: any[] = []

    for (const img of IMAGES) {
      try {
        const res = await fetch(`https://picsum.photos/seed/${img.seed}/1600/900`)
        if (!res.ok) {
          created.push({ seed: img.seed, error: `fetch ${res.status}` })
          continue
        }
        const buf = Buffer.from(await res.arrayBuffer())
        const doc = await payload.create({
          collection: 'media',
          data: {
            alt: img.alt,
            credit: 'Lorem Picsum',
            source: 'Lorem Picsum (placeholder)',
            licenseType: 'public_domain',
          },
          file: { data: buf, mimetype: 'image/jpeg', name: `seed-${img.seed}.jpg`, size: buf.length },
        })
        created.push({ id: doc.id, filename: (doc as any).filename, url: (doc as any).url })
      } catch (e: any) {
        created.push({ seed: img.seed, error: e?.message ?? String(e) })
      }
    }

    // Attach the first successful image as the published story's hero.
    let attached: any = null
    const firstMedia = created.find((c) => c.id)
    if (firstMedia) {
      const stories = await payload.find({
        collection: 'stories',
        where: { status: { equals: 'published' } },
        limit: 1,
      })
      const story = stories.docs[0]
      if (story) {
        await payload.update({
          collection: 'stories',
          id: story.id,
          data: { heroMedia: firstMedia.id },
        })
        attached = { storyId: story.id, heroMedia: firstMedia.id }
      }
    }

    return NextResponse.json({ success: true, created, attached })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? String(e) }, { status: 500 })
  }
}
