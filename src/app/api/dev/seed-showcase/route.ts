import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../payload.config'

/**
 * One-time showcase seed (POST /api/dev/seed-showcase).
 *
 * Creates 4 demo stories — one per layout template — that together exercise
 * every visual-media block type the platform ships with, so the site can
 * demonstrate its own format toolkit. All copy is clearly-fictional demo
 * journalism (each strap says so).
 *
 * Guards:
 *  - Requires header `x-seed-token` to equal env SEED_TOKEN (403 otherwise;
 *    also 403 if SEED_TOKEN is unset, so the route is inert by default).
 *  - Idempotent: any story slug that already exists is skipped, never
 *    duplicated or overwritten. Safe to call repeatedly.
 *  - Reuses existing media uploads only — never uploads binaries. If a needed
 *    media kind (image/audio/video) doesn't exist, the block is replaced with
 *    a Prose format-note and a warning is recorded.
 *
 * Response: { created: string[], skipped: string[], warnings: string[] }
 */

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// Lexical helpers — minimal valid richText JSON for the Prose block's
// `content` field (and Template 4 chapter `content`).
// ---------------------------------------------------------------------------

function lexicalParagraph(text: string) {
  return {
    type: 'paragraph',
    version: 1,
    direction: null as null,
    format: '' as const,
    indent: 0,
    children: [{ type: 'text', text, version: 1 }],
  }
}

function lexical(paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: paragraphs.map(lexicalParagraph),
      direction: null as null,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

/** A Prose layout block. */
function prose(...paragraphs: string[]) {
  return { blockType: 'Prose', content: lexical(paragraphs) }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

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

  const created: string[] = []
  const skipped: string[] = []
  const warnings: string[] = []

  // --- Gather reusable resources -------------------------------------------

  // First user becomes the author of every demo story.
  const usersRes = await payload.find({
    collection: 'users',
    limit: 1,
    sort: 'createdAt',
    depth: 0,
  })
  const author = usersRes.docs[0]
  if (!author) {
    return NextResponse.json(
      { error: 'No users exist — create at least one user before seeding.' },
      { status: 500 },
    )
  }

  // All sections, keyed by slug, so each story can resolve its preferred desk.
  const sectionsRes = await payload.find({
    collection: 'sections',
    limit: 100,
    depth: 0,
  })
  const sections = sectionsRes.docs as Array<{ id: string | number; slug: string }>
  if (sections.length === 0) {
    return NextResponse.json(
      { error: 'No sections exist — seed sections before running the showcase seed.' },
      { status: 500 },
    )
  }
  const sectionBySlug = new Map(sections.map((s) => [s.slug, s]))
  const resolveSection = (candidates: string[], storySlug: string) => {
    for (const c of candidates) {
      const hit = sectionBySlug.get(c)
      if (hit) return hit.id
    }
    warnings.push(
      `Story "${storySlug}": none of the preferred section slugs [${candidates.join(', ')}] exist; ` +
        `fell back to "${sections[0].slug}".`,
    )
    return sections[0].id
  }

  // Existing media uploads, partitioned by kind. We only reuse — no uploads.
  const mediaRes = await payload.find({
    collection: 'media',
    limit: 200,
    sort: 'createdAt',
    depth: 0,
  })
  const mediaDocs = mediaRes.docs as Array<{ id: string | number; mimeType?: string | null }>
  const images = mediaDocs.filter((m) => m.mimeType?.startsWith('image/'))
  const audios = mediaDocs.filter((m) => m.mimeType?.startsWith('audio/'))
  const videos = mediaDocs.filter((m) => m.mimeType?.startsWith('video/'))

  /** Cycle through available images so the four stories don't all share one. */
  const img = (i: number) => (images.length > 0 ? images[i % images.length].id : null)
  const audio = audios.length > 0 ? audios[0].id : null
  const video = videos.length > 0 ? videos[0].id : null

  if (images.length === 0) warnings.push('No image uploads found — image blocks replaced with Prose format-notes.')
  if (!audio) warnings.push('No audio uploads found — AudioClip / audio tracks replaced or omitted.')
  if (!video) warnings.push('No video uploads found — video tracks omitted where optional.')

  /** Prose stand-in for a block whose required media kind is missing. */
  const formatNote = (blockName: string, kind: string) =>
    prose(
      `[Format note: a ${blockName} block belongs here, but no ${kind} file exists in the media library yet. ` +
        `Upload a ${kind} and re-edit this story to see the format in action.]`,
    )

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

  // --- Story definitions ----------------------------------------------------

  type StoryDef = {
    slug: string
    data: Record<string, unknown>
  }

  const stories: StoryDef[] = []

  // ---- Story A — Template 3 (Newspaper Grid) -------------------------------
  // Blocks: Prose, RedactedDocument, Timeline, PullQuote, StatHighlight
  {
    const slug = 'anatomy-of-a-cover-up'
    const layout: unknown[] = [
      prose(
        'For eleven months, the Sarvodaya District Irrigation Board maintained that the Kelwara barrage embankment had passed every scheduled safety inspection. Internal records obtained by this desk tell a different story: three separate engineering assessments, filed between March and September, flagged seepage at the eastern spillway and recommended immediate remediation. None of the three reports appears in the board\'s public disclosure log.',
        'The paper trail is unusually complete. A junior site engineer photographed the original inspection registers before they were replaced; a procurement clerk preserved email chains showing the remediation tender being drafted, then quietly withdrawn. Together the documents map how a routine maintenance failure became an institutional secret — and how the officials responsible built a second, cleaner record for public consumption.',
        'This story is a demonstration piece. Every institution, official, and document described here is fictional, created to showcase how ReportersDesk presents document-driven accountability reporting: annotated source documents, event timelines, and the numbers that anchor the narrative.',
      ),
      images.length > 0
        ? {
            blockType: 'RedactedDocument',
            documentImage: img(0),
            sourceLabel: 'Inspection register, obtained by ReportersDesk',
            caption:
              'Page 14 of the original Kelwara inspection register. The remediation recommendation was absent from the version later filed publicly. (Demo document.)',
          }
        : formatNote('RedactedDocument', 'image'),
      prose(
        'Reconstructing the sequence took four months of records requests and interviews with nine current and former board employees. The timeline below sets out what the board knew, when it knew it, and what it told the public at each stage — the gap between the second and third columns is the story.',
      ),
      {
        blockType: 'Timeline',
        entries: [
          {
            date: 'March 12',
            title: 'First inspection flags seepage',
            detail:
              'Assessment IR-114 records "active seepage, eastern spillway, category B" and recommends remediation within 90 days.',
          },
          {
            date: 'June 3',
            title: 'Remediation tender drafted — then withdrawn',
            detail:
              'Procurement emails show tender documents circulated for approval, then recalled the same week without explanation.',
          },
          {
            date: 'September 21',
            title: 'Third assessment upgrades risk to category A',
            detail: 'The strongest warning yet. It, too, never appears in the public disclosure log.',
          },
          {
            date: 'November 8',
            title: 'Board certifies embankment "fully compliant"',
            detail: 'The public annual safety certificate is signed, citing "no outstanding observations."',
          },
        ],
      },
      {
        blockType: 'PullQuote',
        quote:
          'We filed the reports. What happened to them after they left our desk was above our pay grade — but we kept copies.',
        attribution: 'Former site engineer, Sarvodaya District Irrigation Board (fictional, for demonstration)',
      },
      {
        blockType: 'StatHighlight',
        intro: 'The cover-up, by the numbers',
        stats: [
          { value: '3', label: 'engineering assessments suppressed' },
          { value: '11 months', label: 'between first warning and public disclosure' },
          { value: '₹4.2 cr', label: 'remediation tender drafted, then withdrawn' },
          { value: '9', label: 'insiders who preserved records' },
        ],
      },
      prose(
        'The board did not respond to a detailed list of questions sent two weeks before publication. This demo story shows how the newspaper-grid template handles long-form accountability work: dense text columns, documents presented as evidence, and data given typographic weight.',
      ),
    ]

    stories.push({
      slug,
      data: {
        headline: 'Anatomy of a Cover-Up: The Inspection Reports That Vanished',
        strap:
          'How three safety warnings about a district barrage disappeared from the public record. A fictional demo story showcasing document-led formats.',
        slug,
        section: resolveSection(
          ['investigative-journalism', 'investigative', 'accountability-journalism', 'accountability'],
          slug,
        ),
        author: [author.id],
        heroMedia: img(0) ?? undefined,
        caption: 'The Kelwara barrage embankment, photographed after the first monsoon. (Demo imagery.)',
        layout_type: 'template_3',
        layout,
        status: 'published',
        publishedAt: daysAgo(6),
        editorialReview: { factChecked: true, legallyReviewed: true },
        seoMeta: {
          title: 'Anatomy of a Cover-Up — ReportersDesk format showcase',
          description:
            'Demo investigative story exercising source documents, timelines, pull quotes and stat highlights in the newspaper-grid template.',
        },
      },
    })
  }

  // ---- Story B — Template 4 (Immersive Scrollytelling) ---------------------
  // Blocks: Prose, FullBleedImage, ImageComparison, StatHighlight (+ chapters)
  {
    const slug = 'the-river-that-disappeared'
    const layout: unknown[] = [
      prose(
        'The Sonmati was never a great river. On colonial survey maps it is a modest blue thread, eighty kilometres from the Dharsa hills to its confluence, watering a valley of rice terraces and forty-one villages. But it was a permanent river — until, over a single decade, it wasn\'t. This is the story of how a river disappears: not in one catastrophe, but through a hundred small decisions made upstream.',
        'Satellite imagery, groundwater records, and three seasons of field reporting trace the decline to a familiar pattern — sand mining in the upper reach, unregulated borewells across the recharge zone, and a check-dam programme that treated the river as plumbing rather than as a system. Each intervention was individually legal. Together, they were fatal.',
        'This is a demonstration story: the Sonmati river, its valley, and every person quoted are fictional, created to showcase the immersive scrollytelling template — full-bleed imagery, before/after comparisons, and chaptered narrative that unfolds as you scroll.',
      ),
      images.length > 0
        ? {
            blockType: 'FullBleedImage',
            image: img(1),
            overlayText: 'The bed of the Sonmati, March. Ten years ago this was perennial water.',
            credit: 'Demo photograph — ReportersDesk format showcase',
          }
        : formatNote('FullBleedImage', 'image'),
      prose(
        'The clearest witness is the land itself. Comparing imagery of the same bend near Amjhar village a decade apart shows the channel narrowing, then braiding, then vanishing into sand. Villagers date the change precisely: the year the last dry-season pool at the temple ghat failed to form.',
      ),
      images.length > 0
        ? {
            blockType: 'ImageComparison',
            beforeImage: img(1),
            afterImage: img(2),
            beforeLabel: 'Then',
            afterLabel: 'Now',
            caption:
              'The Amjhar bend, roughly a decade apart. Drag the slider to compare. (Demo imagery standing in for satellite frames.)',
          }
        : formatNote('ImageComparison', 'image'),
      {
        blockType: 'StatHighlight',
        intro: 'A river\'s decline, measured',
        stats: [
          { value: '80 km', label: 'of channel, now seasonal along its full length' },
          { value: '4,700', label: 'borewells drilled in the recharge zone in a decade' },
          { value: '62%', label: 'drop in dry-season flow at the Amjhar gauge' },
          { value: '41', label: 'villages that depended on the river' },
        ],
      },
      prose(
        'Hydrologists interviewed for this piece stress that the Sonmati is not exceptional — it is typical. Small rivers die quietly, below the threshold of national attention, and the paperwork that kills them is almost always in order. The scrollytelling format exists for exactly this kind of story: slow, cumulative, and best understood by seeing the landscape change under your own scroll.',
      ),
    ]

    const chapters: unknown[] = [
      {
        chapterTitle: 'The river on the map',
        content: lexical([
          'On the survey maps the Sonmati is a permanent blue line, eighty kilometres from the Dharsa hills to its confluence. Forty-one villages grew along it. This demo chapter shows how Template 4 opens an immersive story.',
        ]),
        alignment: 'center',
        ...(img(1) ? { backgroundMedia: img(1) } : {}),
        ...(audio ? { ambientAudio: audio } : {}),
      },
      {
        chapterTitle: 'What the sand took',
        content: lexical([
          'Sand mining in the upper reach lowered the bed by two metres in five years. The river responded the only way rivers can: it sank, braided, and let go of its banks.',
        ]),
        alignment: 'left',
        ...(img(2) ? { backgroundMedia: img(2) } : {}),
      },
      {
        chapterTitle: 'The valley after water',
        content: lexical([
          'By the tenth year the Sonmati flowed only in memory and in monsoon. What remains is a channel of sand, a line of abandoned pump-houses — and a lesson in how quietly a river can be lost. (Fictional demo narrative.)',
        ]),
        alignment: 'right',
        ...(img(3) ? { backgroundMedia: img(3) } : {}),
      },
    ]

    stories.push({
      slug,
      data: {
        headline: 'The River That Disappeared',
        strap:
          'Tracing a decade of small, legal decisions that killed a small river. A fictional demo story showcasing the immersive scrollytelling template.',
        slug,
        section: resolveSection(['ground-reportage', 'visual-audio', 'data-journalism'], slug),
        author: [author.id],
        heroMedia: img(1) ?? undefined,
        caption: 'The dry bed of the Sonmati near Amjhar village. (Demo imagery.)',
        layout_type: 'template_4',
        layout,
        scrollytellingChapters: chapters,
        status: 'published',
        publishedAt: daysAgo(4),
        editorialReview: { factChecked: true, legallyReviewed: true },
        seoMeta: {
          title: 'The River That Disappeared — ReportersDesk format showcase',
          description:
            'Demo environmental story exercising full-bleed imagery, before/after comparison, stat highlights and scrollytelling chapters.',
        },
      },
    })
  }

  // ---- Story C — Template 2 (Z-Pattern Scroll), audio-led ------------------
  // Blocks: Prose, AudioClip, SinglePicture, PullQuote
  {
    const slug = 'voices-from-the-ward'
    const layout: unknown[] = [
      prose(
        'The night shift at the district hospital\'s General Ward 4 is staffed, on paper, by three nurses. In practice, for most of the past year, it has been staffed by one. We spent six nights in the ward with recorders running — with the consent of staff and patients — to document what a chronic staffing gap sounds like from the inside.',
        'What the recordings capture is not crisis but endurance: the arithmetic of one nurse triaging forty beds, the improvised handovers, the relatives drafted into care work because there is no one else. Officials describe the vacancies as "transitional." The staff describe them as the job.',
        'This is a demonstration story. The hospital, the ward, and the voices are fictional, produced to showcase how ReportersDesk presents audio-led reporting — embedded clips with waveform players, alongside portraiture and testimony.',
      ),
      audio
        ? {
            blockType: 'AudioClip',
            audioFile: audio,
            title: 'Night rounds, 2:40 a.m.',
            caption:
              'Six minutes from a single night shift: handover notes, a monitor alarm, and the corridor conversation that follows. (Demo audio.)',
          }
        : formatNote('AudioClip', 'audio'),
      prose(
        'The sanctioned strength for the hospital\'s nursing cadre was set in 1998, when the ward admitted half its current caseload. Three recruitment drives since have been announced; none has been completed. Meanwhile the ward has developed its own informal systems — a whiteboard triage code, a relatives\' roster — that exist nowhere in any manual.',
      ),
      images.length > 0
        ? {
            blockType: 'SinglePicture',
            image: img(2),
            caption:
              'Ward 4 in the hour before dawn, when the night\'s work is tallied on the whiteboard. (Demo photograph.)',
          }
        : formatNote('SinglePicture', 'image'),
      {
        blockType: 'PullQuote',
        quote: 'You stop counting the beds. You count the sounds — which alarm, which cough, which silence needs you first.',
        attribution: 'Night-shift nurse, General Ward 4 (fictional, for demonstration)',
      },
      prose(
        'The health department, asked about the vacancies, said recruitment was "in process." The nurses have heard that before; the recordings suggest they have stopped waiting. This demo shows how the Z-pattern template alternates text with audio and imagery to carry a piece where the reporting itself is sound.',
      ),
    ]

    stories.push({
      slug,
      data: {
        headline: 'Voices From the Ward: Six Nights on an Understaffed Shift',
        strap:
          'An audio-led account of what a chronic nursing shortage sounds like from inside a district hospital. A fictional demo story showcasing audio formats.',
        slug,
        section: resolveSection(['policy-people', 'ground-reportage', 'analysis'], slug),
        author: [author.id],
        heroMedia: img(2) ?? undefined,
        caption: 'General Ward 4, photographed between rounds. (Demo imagery.)',
        layout_type: 'template_2',
        layout,
        status: 'published',
        publishedAt: daysAgo(2),
        editorialReview: { factChecked: true, legallyReviewed: true },
        seoMeta: {
          title: 'Voices From the Ward — ReportersDesk format showcase',
          description:
            'Demo audio-led story exercising the AudioClip waveform player, single pictures and pull quotes in the Z-pattern template.',
        },
      },
    })
  }

  // ---- Story D — Template 1 (Three-Column Bleed), gallery-led --------------
  // Blocks: Prose, Diptych, TextPhoto, GalleryAudioVideo
  {
    const slug = 'the-vanishing-commons-gallery'
    const galleryImages = [img(0), img(1), img(2), img(3)].filter((x): x is NonNullable<typeof x> => x != null)
    const layout: unknown[] = [
      prose(
        'Every settlement in the Bharno plateau once kept a commons: grazing land, a tank, a sacred grove, a threshing ground. They appear in the oldest village maps as un-numbered space — land that belonged to everyone because it belonged to no one. Over the past thirty years, plot by plot, that space has been fenced, allotted, encroached, and paved.',
        'This photo essay documents what remains. Working from revenue maps and the memories of the oldest residents, we photographed twelve former commons across six villages — some still half-alive as pasture, others surviving only as a name on a bus stop. The images are paired deliberately: what the map promised against what the ground now shows.',
        'This is a demonstration story. The Bharno plateau and its villages are fictional, assembled to showcase the platform\'s gallery and photo-essay formats: paired images, captioned photo-text spreads, and a swipeable gallery with an optional soundtrack.',
      ),
      images.length > 0
        ? {
            blockType: 'Diptych',
            leftImage: img(0),
            leftCaption: 'The revenue map, 1962: the tank and grove marked as common land. (Demo image.)',
            rightImage: img(1),
            rightCaption: 'The same coordinates today: a boundary wall and a borewell shed. (Demo image.)',
          }
        : formatNote('Diptych', 'image'),
      images.length > 0
        ? {
            blockType: 'TextPhoto',
            text:
              'In Ghatkuri village the old threshing ground survives as a sliver between two house plots — too narrow to fence, too small to farm, and so, by accident, still shared. Children play there in the afternoons. It is the last piece of the commons that functions as one, and nobody can say who it belongs to. That, the oldest resident points out, was always the idea.',
            image: img(3),
            caption: 'The last shared ground in Ghatkuri, photographed at dusk. (Demo photograph.)',
          }
        : formatNote('TextPhoto', 'image'),
      galleryImages.length > 0
        ? {
            blockType: 'GalleryAudioVideo',
            gallery: galleryImages.map((image) => ({ image })),
            ...(audio ? { track: audio } : video ? { track: video } : {}),
          }
        : formatNote('GalleryAudioVideo', 'image'),
      prose(
        'Legal scholars call what happened to the commons "de-recognition by paperwork": land that was never titled could never prove it existed. The villages are now petitioning to have four of the twelve sites restored to the record. This demo shows how the three-column template carries an image-led essay — galleries, diptychs and photo-text spreads doing the narrative work.',
      ),
    ]

    stories.push({
      slug,
      data: {
        headline: 'The Vanishing Commons: A Gallery of What Twelve Villages Lost',
        strap:
          'A photo essay pairing old revenue maps with the fenced, paved ground they describe today. A fictional demo story showcasing gallery formats.',
        slug,
        section: resolveSection(['visual-audio', 'ground-reportage', 'behind-the-process'], slug),
        author: [author.id],
        heroMedia: img(3) ?? undefined,
        caption: 'A former village commons on the Bharno plateau. (Demo imagery.)',
        layout_type: 'template_1',
        layout,
        status: 'published',
        publishedAt: daysAgo(1),
        editorialReview: { factChecked: true, legallyReviewed: true },
        seoMeta: {
          title: 'The Vanishing Commons — ReportersDesk format showcase',
          description:
            'Demo photo essay exercising diptychs, photo-text spreads and the gallery player in the three-column template.',
        },
      },
    })
  }

  // --- Create (idempotently) -------------------------------------------------

  for (const story of stories) {
    try {
      const existing = await payload.find({
        collection: 'stories',
        where: { slug: { equals: story.slug } },
        limit: 1,
        depth: 0,
      })
      if (existing.docs.length > 0) {
        skipped.push(story.slug)
        continue
      }
      await payload.create({
        collection: 'stories',
        data: story.data as any,
        depth: 0,
        overrideAccess: true,
      })
      created.push(story.slug)
    } catch (err) {
      warnings.push(`Failed to create "${story.slug}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ created, skipped, warnings })
}
