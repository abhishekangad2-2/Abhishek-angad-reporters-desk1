import { NextResponse } from 'next/server'

// #4 Collaborative editing — presence foundation. Editors POST a heartbeat
// while a story is open; GET returns who's been active in the last 30s so the
// editor can show "Also editing: …". This is the lightweight presence layer
// (single-instance in-memory); full Google-Docs-style live cursors need a
// CRDT/WebSocket layer (e.g. Yjs) and shared state — a separate, larger build.
export const dynamic = 'force-dynamic'

type Beat = { name: string; ts: number }
const TTL = 30_000
// Module-scoped store. Survives within an instance; resets on cold start.
const g = globalThis as unknown as { __rdPresence?: Map<string, Map<string, Beat>> }
const store = (g.__rdPresence ??= new Map())

function active(storyId: string): string[] {
  const m = store.get(storyId)
  if (!m) return []
  const now = Date.now()
  const out: string[] = []
  for (const [id, b] of m) {
    if (now - b.ts > TTL) m.delete(id)
    else out.push(b.name)
  }
  return out
}

export async function POST(req: Request) {
  try {
    const { storyId, editorId, name } = await req.json()
    if (!storyId || !editorId) return NextResponse.json({ active: [] })
    if (!store.has(storyId)) store.set(storyId, new Map())
    store.get(storyId)!.set(String(editorId), { name: String(name || 'Editor'), ts: Date.now() })
    return NextResponse.json({ active: active(String(storyId)).filter((n) => n !== name) })
  } catch {
    return NextResponse.json({ active: [] })
  }
}

export async function GET(req: Request) {
  const storyId = new URL(req.url).searchParams.get('storyId') || ''
  return NextResponse.json({ active: storyId ? active(storyId) : [] })
}
