import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import { NextResponse } from 'next/server'

// Token-gated seeder for:
//   /api/seed-wb                   → WB SIR story + gallery
//   /api/seed-wb?gallery=1         → gallery only
//   /api/seed-wb?story=1           → WB SIR story only
// Photos are fetched from GCS (already uploaded as thumbs).
// Remove this route in the security pass.

const SEED_TOKEN = 'rd-seed-2026-9c1f'
const BUCKET_BASE = 'https://storage.googleapis.com/reportersdesk-media-secret-walker-497804-d5'

// Gallery photos — all Jharkhand field, photo credit Abhishek Angad
// Man with bicycle (IMG20260410180308) is the WB story hero AND in gallery
const GALLERY_PHOTOS: { file: string; alt: string; caption: string }[] = [
  {
    file: 'IMG20260410180308.jpg',
    alt: 'Man with bicycle on election day, West Bengal',
    caption:
      'A man carries his bicycle past a polling booth on election day in West Bengal, April 2026. The Special Intensive Revision had put his right to vote in question weeks before. Photo: Abhishek Angad',
  },
  {
    file: 'IMG20241109142813.jpg',
    alt: 'Jharkhand village health camp',
    caption:
      'A health camp at a village in Jharkhand, November 2024. Primary care infrastructure across the state remains under pressure despite announced improvements. Photo: Abhishek Angad',
  },
  {
    file: 'IMG20241111141924.jpg',
    alt: 'Jharkhand district hospital ward',
    caption:
      'Inside a district hospital ward in Jharkhand, November 2024. Staffing shortfalls and equipment gaps persisted well after the Covid second wave. Photo: Abhishek Angad',
  },
  {
    file: 'IMG20241111170909.jpg',
    alt: 'Community health workers, Jharkhand',
    caption:
      'Community health workers at a block-level meeting in Jharkhand, November 2024. The ASHA and ANM network bore much of the burden during the Covid peaks. Photo: Abhishek Angad',
  },
  {
    file: 'IMG20241208055319.jpg',
    alt: 'Jharkhand tribal district, early morning',
    caption:
      'Early morning in a tribal district of Jharkhand, December 2024. Remote geography amplifies the distance between patients and care. Photo: Abhishek Angad',
  },
  {
    file: 'IMG20241208055400.jpg',
    alt: 'Jharkhand rural road and heath',
    caption:
      'A rural road in Jharkhand, December 2024. Distance to the nearest Community Health Centre can mean the difference between survival and death during a health emergency. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240801_152018.jpg',
    alt: 'Jharkhand hospital oxygen supply',
    caption:
      'Oxygen cylinders at a Jharkhand hospital, August 2024. Supply gaps during the second Covid wave forced staff to ration oxygen across wards. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240901_213021.jpg',
    alt: 'Jharkhand night reporting, field',
    caption:
      'Field reporting in Jharkhand at night, September 2024. Kala azar, malnutrition and Covid aftereffects continued to burden families long after the declared emergency ended. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20240903_005528.jpg',
    alt: 'Jharkhand village, late night',
    caption:
      'A Jharkhand village in the early hours, September 2024. Families who lost earners to Covid navigate an unsteady recovery with little state support. Photo: Abhishek Angad',
  },
  {
    file: 'IMG_20241020_170105-EDIT.jpg',
    alt: 'Jharkhand CHC exterior',
    caption:
      'A Community Health Centre in Jharkhand, October 2024. A showcause notice following a patient death at a CHC drew wider attention to gaps in primary care. Photo: Abhishek Angad',
  },
]

// WB SIR article body — structured paragraphs for Lexical
const WB_PARAGRAPHS = [
  '32-year-old research scholar Najibur Rahaman Mallick\'s chance to vote in this election in West Bengal doesn\'t seem possible. His name has been excluded from the electoral roll — one among the 27 lakh names whose names were deleted after being picked out in the name of "logical discrepancy" without ascribing any reason. This is despite possessing various documents as age and domicile proof.',
  'Mallick is the "victim" of Election Commission of India\'s (ECI) controversial Special Intensive Revision (SIR) process. He belongs to the Other Backward Class (OBC) Muslim community, and is a resident of Helan village of Hoogly district, claims to have voted every election since becoming eligible at the age of 18.',
  'Helan village in Purushura Assembly Constituency of Hooghly district has two voting booths, and the names of 1568 electors were recorded in the draft list published on December 16, 2025. In a span of two-and-a-half months, more than 320 names were put under adjudication including Mallick, as per the final SIR list published February 28. In the next one month, Mallick and 290 electors were deleted from his village, without any physical or online hearing. He filed an appeal on April 4, which till April 25 shows "pending".',
  '"Disenfranchisement is just the beginning of the troubles for us," said Mallick, who is still waiting for a clearance to vote, pending appeal of his deletions since April 4 in Appellate Tribunals. He is pursuing a Doctor of Philosophy (PhD) in Bengali language and literature, told me at his house in Helan village. Mallick belongs to the "Jolah (Ansari-momin)" Other Backward Community, and he also showed a government issued backward class certificate mentioning the same.',
  'Before the poll began, more than 27 lakh electors were already deleted after adjudication with barely more than 100 names cleared by the Appellate Tribunal after initial adjudication of more than six million electors. In the two phase polls in West Bengal, 152 constituencies out of 294 voted on April 23. In the second phase of the polls, people in the remaining constituencies including Mallick will vote April 29.',
  'The politics of illegal migrants',
  'A controversy had erupted between the state\'s ruling dispensation headed by Chief Minister Mamata Banerjee and the Centre headed by Narendra Modi, who along with his second-in-command Home Minister Amit Shah, have been alleging Banerjee of sheltering illegal immigrants belonging from Muslim minority community for "vote bank". Banerjee, however, had taken a stand that the entire process is "backdoor NRC" which she would not allow in the state.',
  'In West Bengal, the ruling party at the Centre, the BJP, has always wanted to make inroads in the state electorally, however, despite several attempts it has not been able to form the government. The BJP has always alleged mass infiltration of "illegal immigrants" and has accused the TMC government of treating them as vote banks. The SIR (Special Intensive Revision), has been widely seen as a precursor to citizenship exercise, and identifying illegal immigrants and striking out their names from the electoral rolls.',
  'West Bengal saw violence, panic, as well as the opposition to the implementation of the SIR process. For instance in Malda district of West Bengal closer to the Bangladesh border, a protest took an ugly turn when several judicial officers — deployed for clearance of electors\' voting chances in this election by verifying their records — were held hostage. The incident drew the ire of the apex court of India, the BJP, as well as the CM of West Bengal. However, the anxieties of people in Malda, as well as in other parts of the state has certain grounding in the SIR process being completed, without the Appellate Tribunals completing the hearing.',
  'The two sides to conducting elections in the world\'s largest democracy',
  'ECI along with thousands of central and state government employees, under its superintendence, manage several complexities during the election process. The Special Intensive Revision too has seemingly solved one problem of the ECI, long troubling the poll body: the removal of electors under the ASDD list. Otherwise hard to remove as the country lacked scalability of technology, and due to political sensitivities. This is a crucial step in ensuring that the voting percentage rises, and managing the complex system of round the year electoral roll updation.',
  'Earlier, ECI used to remove these electors through a tool by mapping Demographically Similar Entries or Photographically Similar Entries for searching for "duplicates". Largely, according to ECI records, there are two kinds of duplicacies: same electors with multiple Elector Photo Identification Cards (EPICs), and multiple electors with the same EPIC number.',
  'How the ECI pivoted in West Bengal from the Bihar SIR',
  'In West Bengal, total electors, before the process of the SIR began, stood at 7,66,37,529 — or 7.663 crore. The eastern India state has a porous border with Bangladesh, and since the announcement of the SIR, various reports showed hundreds of illegal immigrants packing their bags and leaving West Bengal in November last year.',
  'After the process began, the electors submitted their completed forms including their parents\' name to their respective Booth Level Officers (BLOs). Later, those forms were collected and digitised. However, electors like Mallick had little clue what the process entailed.',
  'In Bihar, the ECI had shared pre-printed enumeration forms to more than 7 crore electors in which they were asked to submit certain documents, with the names of their parents/guardians present in the 2002–03 list, which the ECI took as a base year. In West Bengal, documents were not asked before the draft stage, and the process instead depended on a software which picked 1.40 crore cases of logical discrepancy.',
  'A draft list was published December 16 last year, and Mallick\'s name was included among the 1568 electors who submitted their enumeration forms from Helan village. In West Bengal a total of 7,08,630 electors were in the draft roll, issued by the Office of the Chief Electoral Officer (CEO).',
  'Logical discrepancies',
  'Instead of pushing for the need for submitting mandatory documents at the enumeration phase, the ECI marked 1.36 crore or 13.6 million electors to clear their names emanating out of "logical discrepancies" problem: mismatch in names, misconnection arising out of parents having six children, age gaps between the parents and their children, among others. Since the ECI did not ask for documents at the enumeration stage, it sent notices to the electors, including Mallick.',
  'Mallick claims to have "received a notice on January 29", however, it remains dated January 16. It said that his father\'s name was claimed by six other people, "raising suspicions of a possible misconnection". The notice added: "In view of the discrepancy or possible mismatch with the voter list prepared during the previous SIR, you are requested to appear before the undersigned on January 16, 2026 at 2.30 pm … along with the original documents which will be sent for authenticity." Mallick said that he immediately rushed to the Block office and submitted the requisite documents, however, later his name appeared in the final SIR rolls marked as adjudicated, published in the final West Bengal SIR roll February 28 this year.',
  'Mallick has five other siblings, and barring one, all did not get clearance to vote. "My grandparents were born in West Bengal, part of British India then. They had one son, my late father, and he had six children including me. Tell us why we are not allowed to vote?" Mallick asked.',
  '"Mallick\'s name was deleted after adjudication without any physical or online hearing, and without attributing any reasons." According to court records, 1.40 crore electors were marked under the category of "logical discrepancy" in West Bengal.',
  'The apex court orders, trust deficit, and letters by the Calcutta High Court',
  'Several petitions have been filed in the Supreme Court last year leading to hearings on the SIR matter regularly, including on the curious case of picking out 1.36 crore electors under "logical discrepancies" categories. On January 19, 2026 — between the publication of the draft, and final electoral roll — the Supreme Court issued a set of directions, in a bid to "enable" the electors put under the "logical discrepancy" category.',
  'In between the Calcutta High Court shot a letter to the Supreme Court highlighting the "enormity" of the exercise to be undertaken in "verification of approximately 50,00,000 cases of logical discrepancy/unmapped category assigned to 250 judicial officers". The letter said that even in the event that each judicial officer disposes of around 250 cases per day, the entire exercise would stretch to 80 days.',
  'On March 10, another communication by the Calcutta HC noted more than 10.16 lakh objections have been disposed of, and 700 judicial officers are working "day and night". On April 1, the apex court noted the disposal of 47.3 lakh cases — and in all the cases, the adjudicating officers did not mention the reasons for disposal.',
  '"More than 27 lakh deleted electors after the first adjudication await clearance to vote, some of them may vote April 27 — the last day for the appellate tribunals to hear the appeals for electors to be able to vote on April 29."',
]

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

async function fetchGCSPhoto(filename: string): Promise<Buffer> {
  const url = `${BUCKET_BASE}/jharkhand-gallery/${filename}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GCS fetch failed for ${filename}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('secret') !== SEED_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const doStory = !url.searchParams.get('gallery') || url.searchParams.get('story') === '1'
  const doGallery = !url.searchParams.get('story') || url.searchParams.get('gallery') === '1'

  try {
    const payload = await getPayload({ config: configPromise })

    // ── 1. Upload gallery photos as Payload media docs ──────────────────────
    const mediaIds: Record<string, number | string> = {}
    const mediaLog: string[] = []

    for (const photo of GALLERY_PHOTOS) {
      const existing = await payload.find({
        collection: 'media',
        where: { alt: { equals: photo.alt } },
        limit: 1,
        depth: 0,
      })
      if (existing.totalDocs > 0) {
        mediaIds[photo.file] = existing.docs[0].id
        mediaLog.push(`skip:${photo.file}`)
        continue
      }
      try {
        const buf = await fetchGCSPhoto(photo.file)
        const doc = await payload.create({
          collection: 'media',
          data: {
            alt: photo.alt,
            credit: 'Abhishek Angad',
            source: 'Original',
            licenseType: 'original',
          } as any,
          file: { data: buf, mimetype: 'image/jpeg', name: photo.file, size: buf.length },
        })
        mediaIds[photo.file] = doc.id
        mediaLog.push(`created:${photo.file}`)
      } catch (e: any) {
        mediaLog.push(`error:${photo.file}:${e?.message}`)
      }
    }

    const bicycleId = mediaIds['IMG20260410180308.jpg']

    const adminUsers = await payload.find({ collection: 'users', limit: 1, depth: 0 })
    const adminId = adminUsers.docs[0]?.id

    // ── 2. WB SIR story ─────────────────────────────────────────────────────
    let storyResult: any = null
    if (doStory) {
      const existingStory = await payload.find({
        collection: 'stories',
        where: { slug: { equals: 'west-bengal-sir-logical-discrepancy-27-lakh-electors' } },
        limit: 1,
      })
      if (existingStory.totalDocs > 0) {
        storyResult = { note: 'exists', id: existingStory.docs[0].id }
      } else {
        const sec = await payload.find({
          collection: 'sections',
          where: { slug: { equals: 'ground-reportage' } },
          limit: 1,
        })
        const section = sec.docs[0]

        // GalleryAudioVideo block: gallery of all photos
        const galleryItems = Object.values(mediaIds)
          .filter(Boolean)
          .map((id) => ({ image: id }))

        const story = await payload.create({
          collection: 'stories',
          data: {
            headline:
              'The West Bengal SIR: \'logical discrepancy, trust deficit\'—and the deleted 27 lakh electors',
            slug: 'west-bengal-sir-logical-discrepancy-27-lakh-electors',
            strap:
              'The ECI\'s Special Intensive Revision process deleted 27 lakh names from West Bengal\'s electoral roll. From a village in Hooghly district, the story of what "logical discrepancy" means for those waiting to vote.',
            caption:
              'A man with his bicycle near a polling booth in West Bengal, April 2026. Photo: Abhishek Angad',
            section: section?.id,
            author: adminId ? [adminId] : [],
            publishedAt: new Date('2026-04-27T06:00:00.000Z').toISOString(),
            layout: [
              { blockType: 'Prose', content: lexicalBody(WB_PARAGRAPHS) },
              {
                blockType: 'GalleryAudioVideo',
                gallery: galleryItems.slice(0, 6),
                track: null,
              },
            ],
            status: 'published',
            heroMedia: bicycleId ?? null,
            layout_type: 'template_2',
          } as any,
        })
        storyResult = { created: true, id: story.id }
      }
    }

    // ── 3. Jharkhand photo gallery story ────────────────────────────────────
    let galleryResult: any = null
    if (doGallery) {
      const existingGallery = await payload.find({
        collection: 'stories',
        where: { slug: { equals: 'jharkhand-field-gallery-abhishek-angad' } },
        limit: 1,
      })
      if (existingGallery.totalDocs > 0) {
        galleryResult = { note: 'exists', id: existingGallery.docs[0].id }
      } else {
        const sec = await payload.find({
          collection: 'sections',
          where: { slug: { equals: 'ground-reportage' } },
          limit: 1,
        })
        const section = sec.docs[0]

        const galleryItems = GALLERY_PHOTOS.map((p) => ({
          image: mediaIds[p.file],
          caption: p.caption,
        })).filter((item) => item.image)

        const galleryDoc = await payload.create({
          collection: 'stories',
          data: {
            headline:
              'In frames: Jharkhand\'s health crisis, Covid orphans and the broken rural belt',
            slug: 'jharkhand-field-gallery-abhishek-angad',
            strap:
              'A photo essay from Jharkhand — district hospitals, village health camps, community workers, and the long aftermath of Covid-19. All photographs by Abhishek Angad.',
            caption: 'Photographs from Jharkhand, 2024–2026. Photo credit: Abhishek Angad',
            section: section?.id,
            author: adminId ? [adminId] : [],
            layout: [
              {
                blockType: 'Prose',
                content: lexicalBody([
                  'These photographs were taken across Jharkhand over 2024–2026, during reporting on Covid-19 aftereffects, kala azar, hospital infrastructure and the condition of community health workers.',
                  'All photographs by Abhishek Angad. Photo credit: Abhishek Angad.',
                ]),
              },
              {
                blockType: 'GalleryAudioVideo',
                gallery: galleryItems,
                track: null,
              },
            ],
            status: 'published',
            heroMedia: mediaIds['IMG20241111141924.jpg'] ?? mediaIds['IMG20241109142813.jpg'] ?? null,
            layout_type: 'template_1',
          } as any,
        })
        galleryResult = { created: true, id: galleryDoc.id }
      }
    }

    return NextResponse.json({
      success: true,
      media: { total: GALLERY_PHOTOS.length, log: mediaLog, ids: mediaIds },
      story: storyResult,
      gallery: galleryResult,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? String(e) }, { status: 500 })
  }
}
