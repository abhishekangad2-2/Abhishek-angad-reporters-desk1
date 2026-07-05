'use client'

// Payload's dashboard cards show only the collection/global label. This adds a
// one-line description under each card so an editor understands what it is
// without clicking in. Registered as an `afterDashboard` component; it runs on
// the dashboard route, finds each card link by its /collections/ or /globals/
// href, and appends the matching sentence once. Defensive: no-ops if the DOM
// shape changes.

import React, { useEffect } from 'react'

const HINTS: Record<string, string> = {
  // collections
  stories: 'Every article — write, edit, and move through draft → review → published.',
  media: 'Photos, audio, and video. Upload here, then attach to stories.',
  sections: 'Editorial desks (Accountability, Ground Reportage…) that group stories.',
  issues: 'Optional running threads that bundle related stories together.',
  users: 'Newsroom staff accounts, roles, and 2FA status.',
  'audit-logs': 'Immutable log of every admin action and workflow change.',
  'live-dispatches': 'Short live updates shown in the floating dispatch widget.',
  polls: 'Reader polls — open/close windows and live vote counts.',
  newsletters: 'Compose, schedule, and send newsletter campaigns.',
  'newsletter-subscribers': 'Readers who opted in to the newsletter.',
  subscriptions: 'Active reader/patron subscriptions from Razorpay.',
  transactions: 'Revenue ledger — every Razorpay transaction.',
  payments: 'Individual payment records tied to subscriptions.',
  'rti-requests': 'Internal tracker for FOI / RTI filings.',
  'investigate-requests': 'Reader-submitted investigation tips and leads.',
  // globals
  'design-studio': 'Design the landing page — palette, background simulation, and layout.',
  integrations: 'Third-party keys — analytics, video, translation, payments.',
}

export function DashboardCardHints() {
  useEffect(() => {
    const inject = () => {
      const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="/collections/"], a[href*="/globals/"]')
      links.forEach((a) => {
        const m = a.getAttribute('href')?.match(/\/(?:collections|globals)\/([a-z0-9-]+)/)
        const slug = m?.[1]
        if (!slug) return
        const hint = HINTS[slug]
        if (!hint) return
        // Only decorate dashboard cards (not the nav rail), and only once.
        if (!a.classList.contains('card') && !a.querySelector('.card')) return
        if (a.querySelector('.rd-card-hint')) return
        const p = document.createElement('p')
        p.className = 'rd-card-hint'
        p.textContent = hint
        p.style.cssText =
          'margin:0.4rem 0 0;font-size:0.72rem;line-height:1.35;color:var(--theme-elevation-500);'
        a.appendChild(p)
      })
    }
    inject()
    // Payload re-renders the dashboard async; retry a few times then observe.
    const t1 = setTimeout(inject, 250)
    const t2 = setTimeout(inject, 800)
    const obs = new MutationObserver(() => inject())
    obs.observe(document.body, { childList: true, subtree: true })
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      obs.disconnect()
    }
  }, [])

  return null
}
