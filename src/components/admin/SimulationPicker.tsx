'use client'

// Visual picker for the Design Studio `simulation.kind` field. Each option is
// a tiny inline-SVG vignette of the effect so editors pick by look. Tuning
// (density / speed / intensity / colors) stays in the plain fields below.

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'
import type { SimulationKind } from '../../lib/design'

const OPTIONS: { id: SimulationKind; label: string; blurb: string; art: React.ReactNode }[] = [
  {
    id: 'plexus',
    label: 'Plexus network',
    blurb: 'Connected nodes; leans toward what you hover.',
    art: (
      <svg viewBox="0 0 80 44" width="100%" height="44" aria-hidden>
        <line x1="12" y1="30" x2="34" y2="12" stroke="#3e6b66" strokeWidth="1" />
        <line x1="34" y1="12" x2="58" y2="26" stroke="#3e6b66" strokeWidth="1" />
        <line x1="58" y1="26" x2="70" y2="10" stroke="#3e6b66" strokeWidth="1" />
        <line x1="12" y1="30" x2="46" y2="36" stroke="#3e6b66" strokeWidth="1" />
        {[[12, 30], [34, 12], [58, 26], [70, 10], [46, 36]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#b43d2a" />
        ))}
      </svg>
    ),
  },
  {
    id: 'particles',
    label: 'Particle drift',
    blurb: 'Loose particles drifting like dust in light.',
    art: (
      <svg viewBox="0 0 80 44" width="100%" height="44" aria-hidden>
        {[[8, 34, 1.5], [20, 14, 2], [30, 28, 1], [42, 8, 1.8], [50, 34, 1.2], [62, 18, 2.2], [72, 30, 1.4], [36, 38, 1], [66, 6, 1]].map(
          ([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={i % 3 === 0 ? '#b43d2a' : '#3e6b66'} opacity={0.5 + (i % 4) * 0.12} />
          ),
        )}
      </svg>
    ),
  },
  {
    id: 'waves',
    label: 'Flow waves',
    blurb: 'Layered flowing lines, slow and editorial.',
    art: (
      <svg viewBox="0 0 80 44" width="100%" height="44" aria-hidden>
        <path d="M0 14 Q 20 4 40 14 T 80 14" fill="none" stroke="#3e6b66" strokeWidth="1.4" />
        <path d="M0 24 Q 20 14 40 24 T 80 24" fill="none" stroke="#b43d2a" strokeWidth="1.4" opacity="0.8" />
        <path d="M0 34 Q 20 24 40 34 T 80 34" fill="none" stroke="#3e6b66" strokeWidth="1.4" opacity="0.55" />
      </svg>
    ),
  },
  {
    id: 'constellation',
    label: 'Constellation',
    blurb: 'Sparse starfield; clusters glint near the pointer.',
    art: (
      <svg viewBox="0 0 80 44" width="100%" height="44" aria-hidden>
        {[[10, 10], [26, 30], [40, 8], [55, 22], [70, 34], [64, 8], [18, 38]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="1.4" fill="#b43d2a" />
            <circle cx={x} cy={y} r="3.4" fill="none" stroke="#b43d2a" strokeWidth="0.4" opacity="0.35" />
          </g>
        ))}
        <line x1="26" y1="30" x2="40" y2="8" stroke="#3e6b66" strokeWidth="0.6" opacity="0.5" />
        <line x1="40" y1="8" x2="55" y2="22" stroke="#3e6b66" strokeWidth="0.6" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: 'off',
    label: 'Off',
    blurb: 'No background motion — pure typography.',
    art: (
      <svg viewBox="0 0 80 44" width="100%" height="44" aria-hidden>
        <rect x="10" y="10" width="60" height="4" rx="1" fill="#d1d5db" />
        <rect x="10" y="20" width="44" height="4" rx="1" fill="#d1d5db" />
        <rect x="10" y="30" width="52" height="4" rx="1" fill="#d1d5db" />
      </svg>
    ),
  },
]

export const SimulationPicker: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const current = value || 'plexus'

  return (
    <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>
        Background simulation
        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 400 }}>
          The living layer behind the landing page. Tune density, speed and colors below.
        </div>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {OPTIONS.map((o) => {
          const active = current === o.id
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setValue(o.id)}
              style={{
                textAlign: 'left',
                padding: '0.6rem',
                border: active ? '2px solid #1f2937' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              <div style={{ borderRadius: '3px', overflow: 'hidden', border: '1px solid #eef0f2', background: '#fbfaf7' }}>
                {o.art}
              </div>
              <div style={{ marginTop: '0.45rem', fontSize: '0.8rem', fontWeight: active ? 600 : 400 }}>{o.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.15rem' }}>{o.blurb}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
