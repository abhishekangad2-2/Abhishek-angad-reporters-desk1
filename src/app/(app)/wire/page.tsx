import type { Metadata } from 'next'
import Masthead from '@/components/Masthead'
import TheWire from '@/components/TheWire'
import { readLocale, translateBatch } from '@/lib/translate.server'
import { DEFAULT_LOCALE } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Wire — ReportersDesk',
  description:
    'Live dispatches from Abhishek Angad and ReportersDesk — short, real-time reporting you can react to and reply to.',
}

export default async function WirePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>
}) {
  const sp = await searchParams
  const locale = await readLocale(sp.lang)

  const ui = {
    kicker: 'Live · Field dispatches',
    dek: 'Short, real-time reporting as it happens. React to a dispatch, or reply — we read every one.',
  }
  // Translate the page header into the reader's language. (The live dispatch
  // feed itself — TheWire — fetches from the wire API client-side; localising
  // those bodies is a separate change to that API route.)
  if (locale !== DEFAULT_LOCALE) {
    const uiKeys = Object.keys(ui) as (keyof typeof ui)[]
    const t = await translateBatch(uiKeys.map((k) => ui[k]), locale)
    uiKeys.forEach((k, i) => {
      ui[k] = t[i] || ui[k]
    })
  }

  return (
    <div className="wire-page">
      <Masthead />
      <main className="wire-page-main">
        <header className="wire-page-head">
          <span className="wire-page-kicker">{ui.kicker}</span>
          <h1 className="wire-page-title">The Wire</h1>
          <p className="wire-page-dek">
            {ui.dek}
          </p>
        </header>
        <TheWire limit={50} full />
      </main>
    </div>
  )
}
