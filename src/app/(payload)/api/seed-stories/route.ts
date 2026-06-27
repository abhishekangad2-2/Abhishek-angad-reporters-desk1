import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

// Token-gated, idempotent seeder for the 10 real Jharkhand health/Covid
// headlines from the Abhishek Angad Stories Drive folder (Health subfolder).
// Creates Stories in the Ground Reportage desk, attaching one of the three
// already-uploaded seed photos as the hero so the site looks populated.
// Remove this route in the security pass.
const SEED_TOKEN = 'rd-seed-2026-9c1f'

type Tmpl = 'template_1' | 'template_2' | 'template_3' | 'template_4'

type Seed = {
  slug: string
  headline: string
  strap: string
  body: string
  layout_type: Tmpl
}

const STORIES: Seed[] = [
  {
    slug: 'jharkhand-third-wave-paediatric-plan',
    headline: 'Jharkhand draws up a manual to plan for a third-wave risk to children',
    strap:
      'The state lays out a paediatric Covid preparedness plan even as questions remain over hospital beds, oxygen and trained staff.',
    body: 'The Jharkhand government has prepared a detailed manual anticipating a possible third wave of Covid-19 that could disproportionately affect children, with protocols spanning triage, ward design, oxygen norms and staff training. Officials say the plan responds to expert warnings, although doctors caution that execution at district hospitals will be the test of the document.',
    layout_type: 'template_3',
  },
  {
    slug: 'jharkhand-covid-orphans-grief-loneliness',
    headline: 'Mother was in pain, tried to help, was late: children battle grief, loneliness',
    strap: 'Across Jharkhand, children orphaned by Covid carry on quietly — the state still working out how to support them.',
    body: 'A reporter’s notebook from districts where Covid-19 emptied homes of parents and primary earners. The grief is visible only in passing — a child folding a school uniform, a grandmother counting medicines — but the social, economic and educational consequences are likely to last for years. The piece tracks how the state government is structuring relief, and where the gaps remain.',
    layout_type: 'template_4',
  },
  {
    slug: 'jharkhand-deaths-up-43-percent-survey',
    headline: 'Jharkhand door-to-door survey: April–May deaths up 43% from two years ago',
    strap: 'A state-led mortality survey points to a much larger Covid death toll than the official tally suggests.',
    body: 'A door-to-door survey commissioned by the Jharkhand government shows deaths in April and May rose 43% over a comparable window two years earlier — strongly suggesting Covid-19 was a far heavier driver of mortality than official numbers indicate. The findings echo what families across the state have been describing for months.',
    layout_type: 'template_1',
  },
  {
    slug: 'centre-says-jharkhand-top-shot-wastage',
    headline: 'Centre says Jharkhand is top in vaccine wastage; state says the data is wrong',
    strap: 'A public dispute between the Union and the state over Covid-19 vaccine wastage numbers — and what each measurement actually means.',
    body: 'The Union government has flagged Jharkhand as the top wastage state for Covid-19 vaccines. The state government rejects the calculation, calling the methodology and base figures incorrect. Beneath the dispute is a real question: how wastage is being defined and what it means for vaccine supply in tribal-majority districts.',
    layout_type: 'template_3',
  },
  {
    slug: 'jharkhand-cut-private-vaccine-share',
    headline: 'After Odisha and Tamil Nadu, Jharkhand says cut the private vaccine share',
    strap: 'States ask the Centre to redirect more of the 25% private quota to public channels.',
    body: 'Jharkhand joins Odisha and Tamil Nadu in pressing the Centre to reduce the share of Covid-19 vaccines routed through private hospitals, arguing that public delivery is more equitable and more efficient in rural districts.',
    layout_type: 'template_3',
  },
  {
    slug: 'rural-belt-broken-infrastructure',
    headline: 'In a Jharkhand district with high caseload, the rural belt battles broken infrastructure',
    strap: 'In one of the worst-hit districts, oxygen, beds and trained staff are still scarce — and the road to the nearest hospital is the first hurdle.',
    body: 'From the ground in a district carrying one of Jharkhand’s highest Covid caseloads: stories of patients arriving too late, oxygen cylinders running dry, primary health centres without functional doctors, and ambulances that cannot reach the villages they are meant to serve.',
    layout_type: 'template_2',
  },
  {
    slug: 'hazaribagh-leaky-oxygen-supply',
    headline: 'A leaky oxygen supply system brings fear and anxiety to a Hazaribagh hospital',
    strap: 'The pipes at a key district hospital have been leaking for months — and the staff have learned to ration what little oxygen reaches the wards.',
    body: 'Inside a Hazaribagh hospital where a leaky oxygen supply system has turned routine treatment into a constant calculation. Doctors describe rationing, families describe panic, and engineers describe a patchwork of temporary fixes that no one believes will hold during a surge.',
    layout_type: 'template_3',
  },
  {
    slug: 'kala-azar-death-jharkhand-comorbidities',
    headline: 'Kala azar death in Jharkhand; state says cause is comorbidities',
    strap: 'A death reignites questions about the persistence of kala azar in Jharkhand and what counts as a kala azar death.',
    body: 'A death attributed to kala azar in Jharkhand has reopened a long-running argument over how the disease is recorded. The state attributes the death to comorbidities; doctors and families on the ground say the disease itself remains an under-acknowledged killer in pockets of the state.',
    layout_type: 'template_3',
  },
  {
    slug: 'cm-soren-health-circuit-staff-crunch',
    headline: 'As the health department grapples with a staff crunch, CM Soren says "committed" to a health circuit',
    strap: 'The Chief Minister announces a state-wide health circuit even as the department continues to run on a deep staffing shortfall.',
    body: 'Chief Minister Hemant Soren has announced plans for a state-wide health circuit to improve access to care, even as the Jharkhand health department continues to operate with a persistent shortfall of doctors, nurses and technicians — a gap that the pandemic has only widened.',
    layout_type: 'template_3',
  },
  {
    slug: 'chc-showcause-42-year-old-death',
    headline: 'A 42-year-old dies, a Jharkhand CHC gets a showcause for "inadequacies"',
    strap: 'The death of a 42-year-old patient at a Community Health Centre prompts a showcause notice — and a wider look at primary care.',
    body: 'A 42-year-old patient died at a Community Health Centre in Jharkhand. The administration has issued a showcause notice citing "inadequacies" in care. The case has become a window into the everyday gaps in primary care across the state, well beyond Covid-19.',
    layout_type: 'template_3',
  },
]

function lexicalRoot(text: string) {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [{ type: 'text', version: 1, text, format: 0, mode: 'normal', detail: 0, style: '' }],
        },
      ],
    },
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('secret') !== SEED_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const payload = await getPayload({ config: configPromise })

    // ?video=1 — pull the staged investigation video into a Payload media doc
    // (fires the Transcoder→HLS hook) and build a video story in the
    // Visual & Audio Investigations desk. Idempotent.
    if (url.searchParams.get('video') === '1') {
      const VIDEO_URL =
        'https://storage.googleapis.com/reportersdesk-media-secret-walker-497804-d5/_tmp/investigation.mp4'
      const imgs = await payload.find({ collection: 'media', limit: 20, depth: 0 })
      const poster = imgs.docs.find((m: any) => String(m.mimeType || '').startsWith('image'))
      const posterId = poster?.id

      let videoId: any = null
      const existingVid = await payload.find({
        collection: 'media',
        where: { alt: { equals: 'Investigation video report' } },
        limit: 1,
      })
      if (existingVid.totalDocs > 0) {
        videoId = existingVid.docs[0].id
      } else {
        const res = await fetch(VIDEO_URL)
        if (!res.ok) return NextResponse.json({ error: `video fetch ${res.status}` }, { status: 502 })
        const buf = Buffer.from(await res.arrayBuffer())
        const vid = await payload.create({
          collection: 'media',
          data: { alt: 'Investigation video report', credit: 'Abhishek Angad', source: 'Original', licenseType: 'original' },
          file: { data: buf, mimetype: 'video/mp4', name: 'investigation-video.mp4', size: buf.length },
        })
        videoId = vid.id
      }

      const vsec = await payload.find({
        collection: 'sections',
        where: { slug: { equals: 'visual-and-audio-investigations' } },
        limit: 1,
      })
      const vsection = vsec.docs[0]

      const existingStory = await payload.find({
        collection: 'stories',
        where: { slug: { equals: 'investigation-video-report' } },
        limit: 1,
      })
      if (existingStory.totalDocs > 0) {
        return NextResponse.json({ success: true, video: videoId, story: existingStory.docs[0].id, note: 'exists' })
      }

      const story = await payload.create({
        collection: 'stories',
        data: {
          headline: 'Investigation: a video report from the ground',
          slug: 'investigation-video-report',
          strap: 'A field video investigation — watch the full report.',
          caption: 'A field video investigation.',
          section: vsection?.id,
          layout: [
            { blockType: 'Prose', content: lexicalRoot('A video investigation from the field. Watch the full report below — an HLS rendition is generated automatically, and the player falls back to the source file while it transcodes.') },
            { blockType: 'GalleryAudioVideo', gallery: posterId ? [{ image: posterId }] : [], track: videoId },
          ],
          status: 'published',
          heroMedia: posterId,
          layout_type: 'template_3',
        } as any,
      })
      return NextResponse.json({ success: true, video: videoId, story: story.id })
    }

    const sec = await payload.find({
      collection: 'sections',
      where: { slug: { equals: 'ground-reportage' } },
      limit: 1,
    })
    const section = sec.docs[0]
    if (!section) return NextResponse.json({ error: 'ground-reportage section missing' }, { status: 500 })

    const media = await payload.find({ collection: 'media', limit: 5, depth: 0 })
    const mediaIds = media.docs.map((m: any) => m.id)
    const pickHero = (i: number): number | undefined =>
      mediaIds.length ? mediaIds[i % mediaIds.length] : undefined

    const created: any[] = []
    const skipped: string[] = []

    for (let i = 0; i < STORIES.length; i++) {
      const s = STORIES[i]
      const existing = await payload.find({
        collection: 'stories',
        where: { slug: { equals: s.slug } },
        limit: 1,
      })
      if (existing.totalDocs > 0) {
        skipped.push(s.slug)
        continue
      }
      try {
        const doc = await payload.create({
          collection: 'stories',
          data: {
            headline: s.headline,
            slug: s.slug,
            strap: s.strap,
            caption: s.strap,
            section: section.id,
            layout: [{ blockType: 'Prose', content: lexicalRoot(s.body) }],
            status: 'published',
            heroMedia: pickHero(i),
            layout_type: s.layout_type as any,
          } as any,
        })
        created.push({ id: doc.id, slug: s.slug, headline: s.headline })
      } catch (e: any) {
        created.push({ slug: s.slug, error: e?.message ?? String(e) })
      }
    }

    return NextResponse.json({ success: true, created, skipped, total: created.length + skipped.length })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? String(e) }, { status: 500 })
  }
}
