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
          {/* Logo mark: a desk (bracketed rule) with two pen nibs meeting at
              its centre. Desk inherits the masthead text colour; nibs are the
              house red. */}
          <svg
            className="mh-deskmark"
            viewBox="0 0 200 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Reporters Desk"
          >
            <path
              d="M6 22 V10 H194 V22"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M84 10 L92 6 L100 10 L92 14 Z" fill="#b43d2a" />
            <path d="M116 10 L108 6 L100 10 L108 14 Z" fill="#b43d2a" />
            <path d="M90.5 10 H99" stroke="#5e1a12" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M109.5 10 H101" stroke="#5e1a12" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
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
