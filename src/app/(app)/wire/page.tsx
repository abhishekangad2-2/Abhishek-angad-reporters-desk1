import type { Metadata } from 'next'
import Masthead from '@/components/Masthead'
import TheWire from '@/components/TheWire'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Wire — ReportersDesk',
  description:
    'Live dispatches from Abhishek Angad and ReportersDesk — short, real-time reporting you can react to and reply to.',
}

export default function WirePage() {
  return (
    <div className="wire-page">
      <Masthead />
      <main className="wire-page-main">
        <header className="wire-page-head">
          <span className="wire-page-kicker">Live · Field dispatches</span>
          <h1 className="wire-page-title">The Wire</h1>
          <p className="wire-page-dek">
            Short, real-time reporting as it happens. React to a dispatch, or reply — we read every one.
          </p>
        </header>
        <TheWire limit={50} full />
      </main>
    </div>
  )
}
