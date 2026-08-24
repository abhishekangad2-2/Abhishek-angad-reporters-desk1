import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

// One-off seed: a "Visual Essay" main section with two subsections — Photo Essay
// and Video Documentary — plus one real story in each, built from the Bhagalpur
// arsenic field photos and the field-video YouTube link. Guarded by SEED_TOKEN
// (403 if unset or mismatched), idempotent by slug.
export const dynamic = 'force-dynamic'

function lexical(paras: string[]) {
  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr' as const,
      children: paras.map((p) => ({
        type: 'paragraph',
        version: 1,
        format: '',
        indent: 0,
        direction: 'ltr' as const,
        children: [
          { type: 'text', text: p, version: 1, format: 0, style: '', mode: 'normal' as const, detail: 0 },
        ],
      })),
    },
  }
}
const prose = (...paras: string[]) => ({ blockType: 'Prose', content: lexical(paras) })

export async function POST(req: NextRequest) {
  const expected = process.env.SEED_TOKEN
  const provided = req.headers.get('x-seed-token')
  if (!expected || provided !== expected) {
    return NextResponse.json(
      { error: 'Forbidden. Set SEED_TOKEN and pass it as the x-seed-token header.' },
      { status: 403 },
    )
  }

  const payload = await getPayload({ config })
  const out: Record<string, unknown> = { sections: {}, created: [], skipped: [], warnings: [] }
  const warn = (m: string) => (out.warnings as string[]).push(m)

  // ---- Sections: Visual Essay (parent) + Photo Essay + Video Documentary -----
  async function ensureSection(name: string, slug: string, description: string, parent?: number | string) {
    const existing = await payload.find({ collection: 'sections', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    if (existing.docs[0]) return existing.docs[0].id
    const doc = await payload.create({
      collection: 'sections',
      data: { name, slug, description, ...(parent ? { parent } : {}) } as any,
      overrideAccess: true,
      depth: 0,
    })
    return doc.id
  }

  let visualId: any, photoId: any, videoId: any
  try {
    visualId = await ensureSection(
      'Visual Essay',
      'visual-essay',
      'Reporting told in image and sound — photo essays and field documentaries.',
    )
    photoId = await ensureSection(
      'Photo Essay',
      'photo-essay',
      'Stories told in photographs — captioned spreads, diptychs and galleries from the field.',
      visualId,
    )
    videoId = await ensureSection(
      'Video Documentary',
      'video-documentary',
      'Field documentaries and recorded testimony.',
      visualId,
    )
    ;(out.sections as any) = { visualId, photoId, videoId }
  } catch (e) {
    return NextResponse.json({ error: 'Section setup failed: ' + (e as Error).message }, { status: 500 })
  }

  // Author (first user) for the byline, if any.
  let authorId: any
  try {
    const u = await payload.find({ collection: 'users', limit: 1, depth: 0 })
    authorId = u.docs[0]?.id
  } catch {
    /* byline optional */
  }

  // ---- Photo Essay story -----------------------------------------------------
  const photoSlug = 'the-water-that-poisons-a-photo-essay'
  const photoLayout: unknown[] = [
    prose(
      'In the villages of Pirpainti block, along the Ganges in Bhagalpur, the water that sustains life is also slowly taking it. Years of drinking groundwater laced with arsenic have left their mark on skin, on livers, on whole families. This is a photo essay from Sidhari and its neighbouring hamlets — the people, the homes, and the hands that carry the evidence.',
    ),
    { blockType: 'FullBleedImage', image: 106, credit: 'Photograph: Abhishek Angad / Reporters Desk' },
    {
      blockType: 'TextPhoto',
      text:
        'Sila Devi\'s house in Sidhari. Like most homes here, its water came from a handpump sunk into a shallow aquifer — the same aquifer the state\'s own testing has repeatedly found to carry arsenic above the permissible limit.',
      image: 88,
      caption: 'Sila Devi\'s home in Sidhari, Pirpainti block.',
    },
    {
      blockType: 'Diptych',
      leftImage: 82,
      leftCaption: 'Pinki Devi\'s palm — keratosis, the thickening and scaling of skin that is an early sign of prolonged arsenic exposure.',
      rightImage: 81,
      rightCaption: 'The same condition on the sole of the foot. Keratosis and melanosis are the body\'s first record of the water.',
    },
    prose(
      'Doctors call the sequence melanosis, then keratosis, then — in the worst cases, after years — cancer. In household after household, the same hands tell the same story. What the residents describe as a skin problem is, to a physician, a warning written across the body.',
    ),
    {
      blockType: 'GalleryAudioVideo',
      gallery: [{ image: 115 }, { image: 87 }, { image: 80 }, { image: 107 }].filter(Boolean),
    },
    {
      blockType: 'TextPhoto',
      text:
        'For some, the warning came too late. Where arsenic exposure has progressed to metastatic disease, the treatment is distant, expensive, and often out of reach — a cancer hospital hours away, and a diagnosis that arrives after the damage is done.',
      image: 78,
      caption: 'Sila Devi, whose illness had advanced by the time it was named.',
    },
    prose(
      'The people in these frames are not statistics. They are Sila Devi, Pinki Devi, Umesh — names attached to a crisis that the maps and the reports describe in the abstract. The water is still running. This essay is a record of what it leaves behind.',
    ),
  ]

  // ---- Video Documentary story -----------------------------------------------
  const videoSlug = 'the-making-of-a-cancer-generation-documentary'
  const videoLayout: unknown[] = [
    prose(
      'A short field documentary from Bhagalpur, where groundwater arsenic has shaped the health of a generation. Filmed in the villages of Pirpainti block, it carries the testimony that the data cannot: the voices of the people who live with the water every day.',
    ),
    {
      blockType: 'VideoEmbed',
      embedUrl: 'https://youtu.be/FB9Q9c07DEo',
      caption: 'The making of a cancer generation — a field documentary. (Reporters Desk)',
    },
    prose(
      'The documentary accompanies the investigation into arsenic contamination in Bihar\'s groundwater — the research, the correlation with cancer, and the state\'s response. Watch it alongside the written report and the photo essay for the full account.',
    ),
  ]

  const stories = [
    {
      slug: photoSlug,
      data: {
        headline: 'The Water That Poisons: A Photo Essay from Bhagalpur',
        strap:
          'Along the Ganges in Pirpainti block, years of arsenic in the groundwater are written on the skin and in the homes of the people who drink it.',
        slug: photoSlug,
        section: photoId,
        ...(authorId ? { author: [authorId] } : {}),
        heroMedia: 106,
        caption: 'Entrance to Sila Devi\'s house, Sidhari.',
        layout_type: 'template_1',
        layout: photoLayout,
        status: 'published',
        publishedAt: new Date().toISOString(),
        editorialReview: { factChecked: true, legallyReviewed: true },
      },
    },
    {
      slug: videoSlug,
      data: {
        headline: 'The Making of a Cancer Generation: A Field Documentary',
        strap: 'A short documentary from the arsenic-hit villages of Bhagalpur, Bihar.',
        slug: videoSlug,
        section: videoId,
        ...(authorId ? { author: [authorId] } : {}),
        heroMedia: 80,
        caption: 'The Ganges at Bhagalpur.',
        layout_type: 'template_1',
        layout: videoLayout,
        status: 'published',
        publishedAt: new Date().toISOString(),
        editorialReview: { factChecked: true, legallyReviewed: true },
      },
    },
  ]

  for (const s of stories) {
    try {
      const existing = await payload.find({ collection: 'stories', where: { slug: { equals: s.slug } }, limit: 1, depth: 0 })
      if (existing.docs[0]) {
        ;(out.skipped as string[]).push(s.slug)
        continue
      }
      await payload.create({ collection: 'stories', data: s.data as any, overrideAccess: true, depth: 0 })
      ;(out.created as string[]).push(s.slug)
    } catch (e) {
      warn(`Failed "${s.slug}": ${(e as Error).message}`)
    }
  }

  out.urls = {
    visualEssay: 'https://reporters-desk.org/visual-essay',
    photoEssay: `https://reporters-desk.org/photo-essay/${photoSlug}`,
    videoDocumentary: `https://reporters-desk.org/video-documentary/${videoSlug}`,
  }
  return NextResponse.json(out)
}
