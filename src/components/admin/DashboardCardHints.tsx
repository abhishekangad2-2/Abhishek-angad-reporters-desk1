'use client'

// Payload's dashboard cards show only the collection/global label — a flat grid
// of near-identical text tiles that's hard to scan. This decorates each card
// with (1) a leading category icon in a tinted accent chip beside the title and
// (2) a one-line description below, so an editor reads the dashboard at a glance
// without clicking in. Registered as an `afterDashboard` component; it finds
// each card by its /collections/ or /globals/ href and decorates once.
// Defensive: no-ops if the DOM shape changes.

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
  supporters: 'UPI supporters — Members, Patrons, and one-off contributions.',
  comments: 'Reader comments awaiting moderation or already published.',
  'rti-requests': 'Internal tracker for FOI / RTI filings.',
  'investigate-requests': 'Reader-submitted investigation tips and leads.',
  // globals
  'design-studio': 'Design the landing page — palette, background simulation, and layout.',
  integrations: 'Third-party keys — analytics, video, translation, payments.',
}

// Feather-style 24×24 stroke glyphs (currentColor). One per collection/global,
// with a neutral fallback, so every card carries a recognisable mark.
const I = {
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48 0a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>',
  bar: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  filesearch: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="11.5" cy="14.5" r="2.5"/><line x1="13.3" y1="16.3" x2="15" y2="18"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v3a6 6 0 0 1-12 0V8z"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
} as const

const ICONS: Record<string, string> = {
  stories: I.file,
  media: I.image,
  sections: I.columns,
  issues: I.layers,
  users: I.users,
  'audit-logs': I.shield,
  'live-dispatches': I.radio,
  polls: I.bar,
  newsletters: I.mail,
  'newsletter-subscribers': I.at,
  subscriptions: I.card,
  transactions: I.activity,
  payments: I.card,
  supporters: I.heart,
  comments: I.message,
  'rti-requests': I.filesearch,
  'investigate-requests': I.compass,
  'design-studio': I.sliders,
  integrations: I.plug,
}

const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`

export function DashboardCardHints() {
  useEffect(() => {
    const inject = () => {
      const links = document.querySelectorAll<HTMLAnchorElement>('a[href*="/collections/"], a[href*="/globals/"]')
      links.forEach((a) => {
        const m = a.getAttribute('href')?.match(/\/(?:collections|globals)\/([a-z0-9-]+)/)
        const slug = m?.[1]
        if (!slug) return
        // Only decorate dashboard cards (not the nav rail).
        if (!a.classList.contains('card') && !a.querySelector('.card')) return

        // (1) Leading icon chip beside the title — once.
        const title = a.querySelector<HTMLElement>('.card__title, h1, h2, h3, h4, h5')
        if (title && !title.querySelector('.rd-card-ico')) {
          const ico = document.createElement('span')
          ico.className = 'rd-card-ico'
          ico.innerHTML = svg(ICONS[slug] ?? I.box)
          title.insertBefore(ico, title.firstChild)
        }

        // (2) One-line description below the title — once.
        const hint = HINTS[slug]
        if (hint && !a.querySelector('.rd-card-hint')) {
          const p = document.createElement('p')
          p.className = 'rd-card-hint'
          p.textContent = hint
          a.appendChild(p)
        }
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
