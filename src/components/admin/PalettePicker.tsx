'use client'

// Visual palette picker for the Design Studio global's `palettePreset` field.
// Shows each preset as a four-swatch card (paper / ink / accent / data accent)
// so editors choose by looking, not by reading hex codes. "Custom…" reveals
// the customPalette group via the field's admin.condition.

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'
import { PALETTE_PRESETS, type PalettePresetId } from '../../lib/design'

const CHOICES: { id: PalettePresetId; label: string; colors: string[] }[] = [
  ...(Object.entries(PALETTE_PRESETS) as [Exclude<PalettePresetId, 'custom'>, (typeof PALETTE_PRESETS)[Exclude<PalettePresetId, 'custom'>]][]).map(
    ([id, p]) => ({
      id: id as PalettePresetId,
      label: p.label,
      colors: [p.palette.paper, p.palette.ink, p.palette.accent, p.palette.dataAccent],
    }),
  ),
  { id: 'custom', label: 'Custom…', colors: ['#ffffff', '#888888', '#cccccc', '#444444'] },
]

export const PalettePicker: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const current = value || 'newsroom-classic'

  return (
    <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>
        Landing palette
        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 400 }}>
          Recolors the whole landing page — text, background, accents, and the simulation.
        </div>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {CHOICES.map((c) => {
          const active = current === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setValue(c.id)}
              style={{
                textAlign: 'left',
                padding: '0.6rem',
                border: active ? '2px solid #1f2937' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', height: '2rem', borderRadius: '3px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                {c.colors.map((hex, i) => (
                  <div key={i} style={{ flex: i === 0 ? 2 : 1, backgroundColor: hex }} />
                ))}
              </div>
              <div style={{ marginTop: '0.45rem', fontSize: '0.8rem', fontWeight: active ? 600 : 400 }}>
                {c.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
