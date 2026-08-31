'use client'

import Link from 'next/link'
import type { LandingSection } from '@/lib/landing'
import { useChrome } from '@/components/ChromeLabels'

/** Shared shell masthead — clean top bar: a bold wordmark + byline on the left,
 *  nav on the right. Nav labels read from the translated chrome context so they
 *  follow the reader's language; the brand name stays as-is. */
export default function Masthead({
  labels,
}: {
  // `sections` still accepted (callers pass it); the section nav was removed.
  sections?: LandingSection[]
  labels?: { est?: string; editor?: string }
}) {
  const c = useChrome()
  return (
    <header className="site-masthead">
      <div className="mh-line">
        <div className="mh-brandblock">
          <Link href="/" className="mh-wordmark">
            Reporters Desk
          </Link>
          <span className="mh-sub">
            Abhishek Angad <em className="mh-sub-ink">Ink</em>
          </span>
        </div>
        <nav className="mh-nav" aria-label="Primary">
          <a href="#wire">{c.wire}</a>
          <Link href="/visual-essay">{c.visualEssay}</Link>
          <Link href="/podcast">{c.podcast}</Link>
          <a href="https://reportersdesk.abhishekangad.com">{c.archives} ↗</a>
          <a
            href="https://www.youtube.com/@reportersdeskabhishekangad"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              try {
                ;(window as any).gtag?.('event', 'youtube_channel_click', {
                  link_url: 'https://www.youtube.com/@reportersdeskabhishekangad',
                })
              } catch {
                /* GA not loaded — the link still works */
              }
            }}
          >
            YouTube ↗
          </a>
          <Link href="/support" className="mh-support">{c.support}</Link>
        </nav>
      </div>
    </header>
  )
}
