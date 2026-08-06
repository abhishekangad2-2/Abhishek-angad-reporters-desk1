import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import archive from '@/data/archive.json'

// One-time archive seed (POST /api/dev/seed-archive). Idempotent: creates an
// `archive` doc per JSON entry, skipping any slug that already exists — safe to
// re-run. Gated by the x-seed-token header (== env SEED_TOKEN; 403 if unset).
export const dynamic = 'force-dynamic'

type JsonEntry = {
  category: string
  title: string
  slug: string
  outlet: string
  outlet_inferred: boolean
  date: string | null
  year: string
  date_exact: boolean
  dek: string
  body: string
  source_file: string
}

export async function POST(req: NextRequest) {
  const expected = process.env.SEED_TOKEN
  if (!expected || req.headers.get('x-seed-token') !== expected) {
    return NextResponse.json(
      { error: 'Forbidden. Set SEED_TOKEN and pass it as the x-seed-token header.' },
      { status: 403 },
    )
  }

  const payload = await getPayload({ config })
  const entries = archive as JsonEntry[]
  const created: string[] = []
  const skipped: string[] = []
  const failed: { slug: string; error: string }[] = []

  for (const e of entries) {
    try {
      const existing = await payload.find({
        collection: 'archive',
        where: { slug: { equals: e.slug } },
        limit: 1,
        depth: 0,
      })
      if (existing.docs.length) {
        skipped.push(e.slug)
        continue
      }
      await payload.create({
        collection: 'archive',
        data: {
          title: e.title,
          slug: e.slug,
          category: e.category,
          outlet: e.outlet === '' ? 'none' : e.outlet,
          outletInferred: e.outlet_inferred,
          publishDate: e.date ? new Date(e.date).toISOString() : undefined,
          year: e.year,
          dateExact: e.date_exact,
          dek: e.dek,
          body: e.body,
          sourceFile: e.source_file,
        },
      })
      created.push(e.slug)
    } catch (err) {
      failed.push({ slug: e.slug, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({
    total: entries.length,
    created: created.length,
    skipped: skipped.length,
    failed: failed.length,
    failures: failed.slice(0, 10),
  })
}
