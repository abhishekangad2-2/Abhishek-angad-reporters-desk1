import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

// Token-gated, idempotent seeder for the Dhanbad water-crisis visual story.
// Creates a DRAFT (status: 'draft') so the editor logs in and publishes.
// Photos fetched from GCS dhanbad-web/ (web-optimised), videos from
// dhanbad-water/ (full-res, transcoded via the afterChange hook).
// Remove this route in the security pass.
const SEED_TOKEN = 'rd-seed-2026-9c1f'
const BASE = 'https://storage.googleapis.com/reportersdesk-media-secret-walker-497804-d5'

const PHOTOS: { file: string; alt: string; caption: string }[] = [
  {
    file: 'IMG_20240523_103214.jpg',
    alt: 'Woman walks the path to the rock-ledge water source, Dhanbad',
    caption:
      'A woman sets out along the path carrying an empty jerrycan; behind her, villagers — one wheeling a bicycle loaded with a water can — make the same walk. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103219.jpg',
    alt: 'Woman scoops water from a seep under a rock ledge, Dhanbad',
    caption:
      'Bent under a low rock ledge, a woman dips a bucket into the shallow seep that has become the village\'s drinking-water source. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103222.jpg',
    alt: 'Woman steps into the dark gap beneath the rock ledge',
    caption:
      'A jerrycan in hand, a resident steps toward the dark gap beneath the rock where water still collects. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103233.jpg',
    alt: 'Resident crouches half under the ledge reaching for water',
    caption:
      'There is no well and no working tap here; people crouch into the dark to reach what water remains. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103241.jpg',
    alt: 'Filling a jerrycan at the seep under the rock',
    caption:
      'Filling a jerrycan, vessel by vessel, from the seep under the rock. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103325.jpg',
    alt: 'A resident bends deep under the ledge in ankle-deep water',
    caption:
      'Standing ankle-deep in the muddy pool, a resident works a bucket into the water beneath the ledge. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103328.jpg',
    alt: 'A yellow bucket fills from the muddy seep',
    caption:
      'The water is silty and slow to gather; collecting a single container can take several minutes. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103330.jpg',
    alt: 'Steadying the bucket in the shallow pool under the rock',
    caption:
      'Steadying the bucket in the shallow pool, careful not to stir up the sediment. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103337.jpg',
    alt: 'Lifting the filled bucket from the water under the ledge',
    caption:
      'Lifting the filled bucket clear of the water before the walk home. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103427.jpg',
    alt: 'Securing the lid of a full jerrycan at the mouth of the seep',
    caption:
      'A full jerrycan is sealed at the mouth of the seep — enough for a household, until the next walk. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103514.jpg',
    alt: 'Wide view of the overgrown approach to the rock-ledge water source',
    caption:
      'The water source sits at the end of an overgrown track, well outside the village — a daily walk in the pre-monsoon heat. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240523_103544.jpg',
    alt: 'Two women on the path to and from the rock-ledge water source',
    caption:
      'One woman heads back with her vessels filled as another waits her turn at the ledge. Dhanbad, May 2024. Photo: Abhishek Angad',
  },
]

const VIDEOS: { file: string; alt: string; caption: string }[] = [
  {
    file: 'VID_20240523_102215.mp4',
    alt: 'Dhanbad water crisis — video 1',
    caption: 'At the water source under the rock ledge. Dhanbad, May 2024. Video: Abhishek Angad',
  },
  {
    file: 'VID_20240523_102657.mp4',
    alt: 'Dhanbad water crisis — video 2',
    caption: 'Residents collect drinking water from the seep. Dhanbad, May 2024. Video: Abhishek Angad',
  },
  {
    file: 'VID_20240523_103249.mp4',
    alt: 'Dhanbad water crisis — video 3',
    caption: 'The walk to and from the source. Dhanbad, May 2024. Video: Abhishek Angad',
  },
]

const STANDFIRST =
  'During the 2024 elections, when this reporter travelled through the suburbs of Dhanbad district, many residents said drinking water had become a rare commodity. Mining has long been the area\'s key economic driver — and residents are aware that the same mining activity has drawn down the water table. With wells and taps dry, families walk to a seep under a rock ledge to fill their vessels. They are pinning their hopes on a water pipeline reaching their villages.'

const CONTEXT_1 =
  'There is no ceremony to it. Before the heat of the day sets in, women and men from the village take the overgrown track out to a low rock ledge, crouch into the dark, and scoop what water has gathered overnight into yellow jerrycans and buckets. It is slow, silty work — and it is the only drinking water many here can reach.'

function para(text: string) {
  return {
    type: 'paragraph',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [{ type: 'text', version: 1, text, format: 0, mode: 'normal', detail: 0, style: '' }],
  }
}

function lexicalBody(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: paragraphs.map(para),
    },
  }
}

async function fetchBuf(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${res.status} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('secret') !== SEED_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config: configPromise })
    const log: string[] = []

    const users = await payload.find({ collection: 'users', limit: 1, depth: 0 })
    const adminUser = users.docs[0]
    const adminId = adminUser?.id
    if (adminUser && (!adminUser.firstName || !adminUser.lastName)) {
      await payload.update({
        collection: 'users',
        id: adminId,
        data: {
          firstName: (adminUser.firstName as string | undefined) || 'Abhishek',
          lastName: (adminUser.lastName as string | undefined) || 'Angad',
        } as any,
      })
    }

    // ── 1. Photo media docs (web-optimised copies) ──────────────────────────
    const photoIds: Record<string, number | string> = {}
    for (const p of PHOTOS) {
      const existing = await payload.find({
        collection: 'media',
        where: { alt: { equals: p.alt } },
        limit: 1,
        depth: 0,
      })
      if (existing.totalDocs > 0) {
        photoIds[p.file] = existing.docs[0].id
        log.push(`photo skip:${p.file}`)
        continue
      }
      try {
        const buf = await fetchBuf(`${BASE}/dhanbad-web/${p.file}`)
        const doc = await payload.create({
          collection: 'media',
          data: { alt: p.alt, credit: 'Abhishek Angad', source: 'Original', licenseType: 'original' } as any,
          file: { data: buf, mimetype: 'image/jpeg', name: p.file, size: buf.length },
        })
        photoIds[p.file] = doc.id
        log.push(`photo created:${p.file}`)
      } catch (e: any) {
        log.push(`photo error:${p.file}:${e?.message}`)
      }
    }

    // ── 2. Video media docs (full-res; fires Transcoder→HLS hook) ────────────
    const videoIds: Record<string, number | string> = {}
    for (const v of VIDEOS) {
      const existing = await payload.find({
        collection: 'media',
        where: { alt: { equals: v.alt } },
        limit: 1,
        depth: 0,
      })
      if (existing.totalDocs > 0) {
        videoIds[v.file] = existing.docs[0].id
        log.push(`video skip:${v.file}`)
        continue
      }
      try {
        const buf = await fetchBuf(`${BASE}/dhanbad-water/${v.file}`)
        const doc = await payload.create({
          collection: 'media',
          data: { alt: v.alt, credit: 'Abhishek Angad', source: 'Original', licenseType: 'original' } as any,
          file: { data: buf, mimetype: 'video/mp4', name: v.file, size: buf.length },
        })
        videoIds[v.file] = doc.id
        log.push(`video created:${v.file}`)
      } catch (e: any) {
        log.push(`video error:${v.file}:${e?.message}`)
      }
    }

    // ── 3. The visual story (DRAFT) ─────────────────────────────────────────
    const existingStory = await payload.find({
      collection: 'stories',
      where: { slug: { equals: 'dhanbad-water-crisis' } },
      limit: 1,
    })
    if (existingStory.totalDocs > 0) {
      return NextResponse.json({
        success: true,
        note: 'story exists',
        story: existingStory.docs[0].id,
        photos: photoIds,
        videos: videoIds,
        log,
      })
    }

    const sec = await payload.find({
      collection: 'sections',
      where: { slug: { equals: 'ground-reportage' } },
      limit: 1,
    })
    const section = sec.docs[0]

    const heroId = photoIds['IMG_20240523_103219.jpg'] ?? Object.values(photoIds)[0]

    const firstGallery = PHOTOS.slice(0, 6)
      .map((p) => ({ image: photoIds[p.file], caption: p.caption }))
      .filter((i) => i.image)
    const secondGallery = PHOTOS.slice(6)
      .map((p) => ({ image: photoIds[p.file], caption: p.caption }))
      .filter((i) => i.image)

    const layout: any[] = [
      { blockType: 'Prose', content: lexicalBody([STANDFIRST]) },
    ]
    if (heroId) {
      layout.push({
        blockType: 'FullBleedImage',
        image: heroId,
        overlayText: 'The water crisis of Dhanbad',
        credit: 'Abhishek Angad',
      })
    }
    layout.push({ blockType: 'Prose', content: lexicalBody([CONTEXT_1]) })
    if (firstGallery.length) layout.push({ blockType: 'GalleryAudioVideo', gallery: firstGallery, track: null })
    if (videoIds['VID_20240523_102215.mp4'])
      layout.push({ blockType: 'VideoEmbed', videoFile: videoIds['VID_20240523_102215.mp4'], caption: VIDEOS[0].caption })
    layout.push({
      blockType: 'PullQuote',
      quote: 'Drinking water has become a rare commodity. The mines gave the area its livelihood — and took its water table with them.',
      attribution: 'Residents, Dhanbad suburbs',
    })
    if (videoIds['VID_20240523_102657.mp4'])
      layout.push({ blockType: 'VideoEmbed', videoFile: videoIds['VID_20240523_102657.mp4'], caption: VIDEOS[1].caption })
    if (secondGallery.length) layout.push({ blockType: 'GalleryAudioVideo', gallery: secondGallery, track: null })
    if (videoIds['VID_20240523_103249.mp4'])
      layout.push({ blockType: 'VideoEmbed', videoFile: videoIds['VID_20240523_103249.mp4'], caption: VIDEOS[2].caption })

    const story = await payload.create({
      collection: 'stories',
      data: {
        headline: 'The water crisis of Dhanbad: where drinking water has become a rare commodity',
        slug: 'dhanbad-water-crisis',
        strap:
          'In the suburbs of a district built on coal, families walk to a seep under a rock ledge for drinking water. Mining drove the economy — and drew down the water table. Their hope now rests on a pipeline.',
        caption: 'A woman collects drinking water from a seep under a rock ledge. Dhanbad, May 2024. Photo: Abhishek Angad',
        section: section?.id,
        author: adminId ? [adminId] : [],
        layout,
        status: 'draft',
        heroMedia: heroId ?? null,
        layout_type: 'template_2',
      } as any,
    })

    return NextResponse.json({
      success: true,
      story: story.id,
      status: 'draft',
      photos: photoIds,
      videos: videoIds,
      log,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? String(e) }, { status: 500 })
  }
}
