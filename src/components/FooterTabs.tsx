'use client'

import { useState } from 'react'
import { PaymentTab, NewsletterTab, PollTab, FounderBioTab } from './FooterPanels'

const TABS = [
  { id: 'pay', label: 'Pay for our journalism', Component: PaymentTab },
  { id: 'newsletter', label: 'Subscribe to our newsletter', Component: NewsletterTab },
  { id: 'poll', label: 'Poll Section', Component: PollTab },
  { id: 'bio', label: 'About the founder', Component: FounderBioTab },
] as const

export default function FooterTabs() {
  const [openTab, setOpenTab] = useState<(typeof TABS)[number]['id'] | null>(null)
  const ActiveTab = TABS.find((t) => t.id === openTab)

  return (
    <footer className="footer-tabs">
      <div className="footer-tab-row" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={openTab === t.id}
            onClick={() => setOpenTab(openTab === t.id ? null : t.id)}
            className={`footer-tab ${openTab === t.id ? 'footer-tab--active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {ActiveTab && (
        <div className="footer-panel-wrap" role="tabpanel">
          <ActiveTab.Component />
        </div>
      )}
    </footer>
  )
}
