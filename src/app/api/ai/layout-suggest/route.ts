import { NextResponse } from 'next/server'

// #3 Intelligent Layout Co-Pilot — recommendation engine. Scores a story's
// block composition against ReportersDesk layout principles. This is the
// deterministic-heuristic core; "learned optimization" can later bias these
// weights from stored editor choices (see comment below).
// POST { blocks: { text, image, gallery, video, audio, quote, data } }
//   -> { layout: 'three-column'|'z-pattern'|'newspaper'|'immersive', reason, scores }
export const dynamic = 'force-dynamic'

type Blocks = Partial<Record<'text' | 'image' | 'gallery' | 'video' | 'audio' | 'quote' | 'data', number>>

export async function POST(req: Request) {
  let b: Blocks = {}
  try {
    b = (await req.json())?.blocks ?? {}
  } catch {}
  const n = (k: keyof Blocks) => Number(b[k] || 0)
  const media = n('image') + n('gallery') + n('video')

  const scores = {
    immersive: n('gallery') * 2 + n('video') * 2 + n('audio') * 3 + (media >= 3 ? 2 : 0),
    newspaper: (n('text') >= 4 ? 3 : 0) + n('data') * 2 + (media >= 1 && media <= 2 ? 2 : 0),
    'z-pattern': (n('image') >= 3 ? 2 : 0) + n('quote') + (n('text') >= 2 ? 1 : 0),
    'three-column': 1, // baseline discovery layout
  }
  const reasons: Record<string, string> = {
    immersive: 'Image/audio-led feature — best as a single immersive scrollytelling piece.',
    newspaper: 'Text-heavy with data/infographics — a broadsheet lead-and-rail reads cleanest.',
    'z-pattern': 'Several images and pull-quotes — an alternating guided read suits it.',
    'three-column': 'A balanced mix — the discovery three-column grid works well.',
  }
  const layout = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    'three-column') as keyof typeof scores
  return NextResponse.json({ layout, reason: reasons[layout], scores })
}
