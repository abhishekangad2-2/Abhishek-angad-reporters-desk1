'use client'

import { useRef, useState } from 'react'
import { PaymentTab, NewsletterTab, PollTab, InvestigateTab, FounderBioTab } from './FooterPanels'
import { useChrome } from '@/components/ChromeLabels'

const TABS = [
  { id: 'investigate', label: 'Investigate this', Component: InvestigateTab },
  { id: 'pay', label: 'Pay for our journalism', Component: PaymentTab },
  { id: 'newsletter', label: 'Subscribe to our newsletter', Component: NewsletterTab },
  { id: 'poll', label: 'Poll Section', Component: PollTab },
  { id: 'bio', label: 'About the founder', Component: FounderBioTab },
] as const

// Contact + social strip in the footer. Only entries with a non-empty `href`
// render, so adding Instagram/YouTube/X later is just filling in the URL.
const SOCIAL_LINKS: { id: string; label: string; href: string; icon: React.ReactNode }[] = [
  {
    id: 'email',
    label: 'Email the newsroom',
    href: 'mailto:newsletters@reporters-desk.org',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: '',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com/@reportersdeskabhishekangad',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" />
        <path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    href: 'https://x.com/RDreportersdesk',
    icon: (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
        <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.9l-4.7-6.14L5.5 22H2.24l8.02-9.17L1.5 2h6.9l4.26 5.63L18.244 2Zm-1.21 18h1.8L7.04 3.86H5.1L17.034 20Z" />
      </svg>
    ),
  },
]

export default function FooterTabs() {
  const [openTab, setOpenTab] = useState<(typeof TABS)[number]['id'] | null>(null)
  const ActiveTab = TABS.find((t) => t.id === openTab)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const c = useChrome()
  // Tab ids line up with the chrome-label keys, so the visible labels follow
  // the reader's language.
  const labelFor = (id: (typeof TABS)[number]['id']) =>
    (c as Record<string, string>)[id] ?? TABS.find((t) => t.id === id)?.label ?? id

  // Roving focus via arrow keys, per the WAI-ARIA tablist pattern. Home/End
  // jump to the ends; the focused tab is what the user activates with Enter.
  function onKeyDown(e: React.KeyboardEvent, index: number) {
    let next = index
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % TABS.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + TABS.length) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return
    e.preventDefault()
    tabRefs.current[next]?.focus()
  }

  return (
    <footer className="footer-tabs">
      <div className="footer-tab-row" role="tablist" aria-label="More from ReportersDesk">
        {TABS.map((t, i) => {
          const selected = openTab === t.id
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              id={`footer-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`footer-panel-${t.id}`}
              tabIndex={selected || (openTab === null && i === 0) ? 0 : -1}
              onClick={() => setOpenTab(selected ? null : t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`footer-tab ${selected ? 'footer-tab--active' : ''}`}
            >
              {labelFor(t.id)}
            </button>
          )
        })}
      </div>
      {ActiveTab && (
        <div
          className="footer-panel-wrap"
          role="tabpanel"
          id={`footer-panel-${ActiveTab.id}`}
          aria-labelledby={`footer-tab-${ActiveTab.id}`}
          tabIndex={0}
        >
          <ActiveTab.Component />
        </div>
      )}

      <div className="footer-connect">
        <span className="footer-connect-label">Connect</span>
        <nav className="footer-social" aria-label="Contact and social">
          {SOCIAL_LINKS.filter((s) => s.href).map((s) => {
            const external = !s.href.startsWith('mailto:')
            return (
              <a
                key={s.id}
                className="footer-social-link"
                href={s.href}
                aria-label={s.label}
                title={s.label}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {s.icon}
              </a>
            )
          })}
        </nav>
      </div>
    </footer>
  )
}
