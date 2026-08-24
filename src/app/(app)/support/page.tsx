import type { Metadata } from 'next'
import Masthead from '@/components/Masthead'
import UpiSupport from '@/components/UpiSupport'
import { readLocale, translateBatch } from '@/lib/translate.server'
import './support.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Support — Reporters Desk',
  description:
    'Support independent, reader-funded ground reportage by Abhishek Angad. Scan the UPI QR to contribute any amount.',
}

export default async function SupportPage() {
  const locale = await readLocale()
  const [title, dek, note] = await translateBatch(
    [
      'Support independent journalism',
      'Reporters Desk is reader-funded ground reportage — investigations, RTIs and field journalism, with no paywall and no ads. Your contribution keeps it independent.',
      'Prefer to give regularly? Reader membership and FOI Patron plans are coming soon.',
    ],
    locale,
  )

  return (
    <div className="support">
      <Masthead />
      <main className="support-main">
        <header className="support-head">
          <span className="support-kicker">◆</span>
          <h1 className="support-title">{title}</h1>
          <p className="support-dek">{dek}</p>
        </header>

        <div className="support-card">
          <UpiSupport size={210} />
        </div>

        <p className="support-note">{note}</p>
      </main>
    </div>
  )
}
