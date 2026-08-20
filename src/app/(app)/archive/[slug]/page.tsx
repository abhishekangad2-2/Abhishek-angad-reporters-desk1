import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEntries, entryBySlug, displayDate, bodyParagraphs } from '@/lib/archive'
import { readLocale, translateBatchChunked } from '@/lib/translate.server'
import { DEFAULT_LOCALE } from '@/lib/i18n'
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
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string | string[] }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const locale = await readLocale(sp.lang)
  const e = entryBySlug(await getEntries(), slug)
  if (!e) notFound()

  // Render in the visitor's language when a non-English locale is active. The
  // outlet name + date stay as-is (proper noun / already localised by display).
  let category = e.category
  let title = e.title
  let dek = e.dek
  let paras = bodyParagraphs(e)
  if (locale !== DEFAULT_LOCALE) {
    const t = await translateBatchChunked([e.category, e.title, e.dek, ...paras], locale)
    category = t[0] ?? e.category
    title = t[1] ?? e.title
    dek = t[2] ?? e.dek
    paras = t.slice(3)
  }

  return (
    <div className="arc arc--reading">
      <div className="arc-entry">
        <Link href="/" className="arc-back">
          ← Archive
        </Link>

        <span className="arc-entry-kicker">{category}</span>
        <h1 className="arc-entry-head">{title}</h1>
        {dek && <p className="arc-entry-dek">{dek}</p>}

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

        <Link href="/" className="arc-back arc-back--foot">
          ← Back to the archive
        </Link>
      </div>
    </div>
  )
}
