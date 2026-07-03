'use client'

import { useRef, useState } from 'react'
import { PaymentTab, NewsletterTab, PollTab, InvestigateTab, FounderBioTab } from './FooterPanels'

const TABS = [
  { id: 'investigate', label: 'Investigate this', Component: InvestigateTab },
  { id: 'pay', label: 'Pay for our journalism', Component: PaymentTab },
  { id: 'newsletter', label: 'Subscribe to our newsletter', Component: NewsletterTab },
  { id: 'poll', label: 'Poll Section', Component: PollTab },
  { id: 'bio', label: 'About the founder', Component: FounderBioTab },
] as const

export default function FooterTabs() {
  const [openTab, setOpenTab] = useState<(typeof TABS)[number]['id'] | null>(null)
  const ActiveTab = TABS.find((t) => t.id === openTab)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

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
              {t.label}
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
    </footer>
  )
}
