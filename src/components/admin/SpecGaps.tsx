'use client'

// Spec-gap board — shown at the top of the CMS dashboard (beforeDashboard).
// Tracks the canonical ReportersDesk spec (HRIE + AEC + IDPB) against what is
// actually built and live, so the state of the platform is visible inside the
// CMS itself rather than in chat logs. Update statuses here when items ship.

import React from 'react'

type Status = 'built' | 'pending' | 'deferred'

const STATUS_STYLE: Record<Status, { bg: string; fg: string; label: string }> = {
  built: { bg: '#f0fdf4', fg: '#166534', label: 'BUILT' },
  pending: { bg: '#fffbeb', fg: '#92400e', label: 'PENDING' },
  deferred: { bg: '#f3f4f6', fg: '#4b5563', label: 'DEFERRED' },
}

const ITEMS: { pillar: string; entries: { name: string; status: Status; note?: string }[] }[] = [
  {
    pillar: 'HRIE — immersive front-end',
    entries: [
      { name: 'Four landing layouts (Z-axis / X-Y / Newspaper / Immersive)', status: 'built' },
      { name: 'Design Studio — palette, simulation, layout switcher', status: 'built', note: 'Appearance → Design Studio' },
      { name: 'Four WebGL simulations (Plexus / Particles / Waves / Constellation)', status: 'built' },
      { name: 'Reader accessibility gear (motion / Low-Power / disable 3D)', status: 'built' },
      { name: 'Live Dispatches + Plexus Pulse', status: 'built', note: 'SSE with poll fallback (spec said WebSocket)' },
      { name: 'True Z-axis camera-dolly scroll', status: 'deferred', note: 'CSS-3D + plexus hybrid chosen (CDN CORS constraint)' },
    ],
  },
  {
    pillar: 'AEC — editorial CMS',
    entries: [
      { name: '13 visual-media blocks · 4 story templates', status: 'built', note: 'Template 4 renders layout blocks below chapters' },
      { name: 'Layout Co-Pilot, AI tags & captions', status: 'built', note: 'Captions need Vision key (mounted)' },
      { name: '2FA (TOTP + hashed backup codes), roles, workflow, audit', status: 'built' },
      { name: 'Admin address: /admin', status: 'built', note: 'Public editor-login link removed' },
      { name: 'Audio showcase story', status: 'pending', note: 'Upload one audio file in Media, then re-run the seed' },
      { name: 'Credential rotation (password / TOTP / PAYLOAD_SECRET)', status: 'pending', note: 'Owner action — old ones were exposed' },
    ],
  },
  {
    pillar: 'IDPB — engagement & patronage',
    entries: [
      { name: 'Patronage Beacon (dwell + scroll triggers, cooldown)', status: 'built' },
      { name: 'Polls, newsletter, Investigate-this intake', status: 'built' },
      { name: 'Razorpay payments live', status: 'pending', note: 'Mount RAZORPAY_WEBHOOK_SECRET + real keys/plan IDs on Cloud Run' },
      { name: 'GA4 traffic-spike beacon trigger', status: 'pending', note: 'Needs GA_PROPERTY_ID + GA_SA_KEY env' },
      { name: 'ML-learned layout optimization', status: 'deferred', note: 'Heuristic today' },
      { name: 'Collaborative cursors (CRDT)', status: 'deferred', note: 'Presence-only today' },
    ],
  },
]

export const SpecGaps: React.FC = () => {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Spec status — HRIE · AEC · IDPB</h2>
        <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>vs the canonical spec · updated 2026-07-04</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {ITEMS.map((group) => (
          <div key={group.pillar}>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6b7280',
                marginBottom: '0.4rem',
              }}
            >
              {group.pillar}
            </div>
            {group.entries.map((e) => {
              const s = STATUS_STYLE[e.status]
              return (
                <div key={e.name} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.25rem 0' }}>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '3px',
                      background: s.bg,
                      color: s.fg,
                      marginTop: '0.1rem',
                    }}
                  >
                    {s.label}
                  </span>
                  <span style={{ fontSize: '0.82rem', lineHeight: 1.35 }}>
                    {e.name}
                    {e.note && <span style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280' }}>{e.note}</span>}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
