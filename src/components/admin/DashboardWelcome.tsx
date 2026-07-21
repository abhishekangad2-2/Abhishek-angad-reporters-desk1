'use client'

// Branded dashboard hero — the first thing every editor sees on the CMS
// dashboard (beforeDashboard, all roles). Payload's stock dashboard opens on a
// bare grid of cards; this gives it a masthead: the ReportersDesk nameplate, a
// house-red gradient with a faint plexus texture, and a personal greeting +
// dateline. Styling lives in AdminStyles' injected CSS (.rd-welcome*).

import React, { useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'

export const DashboardWelcome: React.FC = () => {
  const { user } = useAuth()
  const u = user as { name?: string; email?: string } | null
  const name = u?.name || u?.email?.split('@')[0] || 'Newsroom'

  // Compute the dateline after mount so SSR and client render the same markup.
  const [dateline, setDateline] = useState('')
  useEffect(() => {
    try {
      setDateline(
        new Date().toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      )
    } catch {
      /* leave empty */
    }
  }, [])

  return (
    <section className="rd-welcome" aria-label="ReportersDesk editorial dashboard">
      <div className="rd-welcome__inner">
        <span className="rd-welcome__eyebrow">Editorial Control · Est. 2026</span>
        <h1 className="rd-welcome__title">
          Reporters<span>Desk</span>
        </h1>
        <p className="rd-welcome__sub">
          Abhishek Angad <em>Ink</em> — long-form, investigative journalism
        </p>
      </div>
      <div className="rd-welcome__meta">
        <span className="rd-welcome__hi">Welcome back, {name}</span>
        {dateline && <span className="rd-welcome__date">{dateline}</span>}
      </div>
    </section>
  )
}
