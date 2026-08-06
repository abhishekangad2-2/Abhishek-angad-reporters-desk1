import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEntries, entryBySlug, displayDate, bodyParagraphs } from '@/lib/archive'
import '../archive.css'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const e = entryBySlug(await getEntries(), slug)
  if (!e) return { title: 'Not found — Archive' }
  return {
    title: `${e.title} — Abhishek Angad`,
    description: e.dek || e.body.slice(0, 160),
  }
}

export default async function ArchiveEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const e = entryBySlug(await getEntries(), slug)
  if (!e) notFound()

  const paras = bodyParagraphs(e)

  return (
    <div className="arc arc--reading">
      <div className="arc-entry">
        <Link href="/archive" className="arc-back">
          ← Archive
        </Link>

        <span className="arc-entry-kicker">{e.category}</span>
        <h1 className="arc-entry-head">{e.title}</h1>
        {e.dek && <p className="arc-entry-dek">{e.dek}</p>}

        <div className="arc-entry-meta">
          <span className="arc-entry-by">By Abhishek Angad</span>
          {e.outlet && <span className="arc-entry-outlet">{e.outlet}</span>}
          <span className="arc-entry-date">
            {displayDate(e)}
            {!e.date_exact && <span className="arc-approx"> (year)</span>}
          </span>
        </div>

        <article className="arc-prose">
          {paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>

        {e.outlet && (
          <p className="arc-attrib">
            Originally published in <strong>{e.outlet}</strong>. Reproduced here as part of the
            author&apos;s clips archive; rights remain with the original publication.
          </p>
        )}

        <Link href="/archive" className="arc-back arc-back--foot">
          ← Back to the archive
        </Link>
      </div>
    </div>
  )
}
