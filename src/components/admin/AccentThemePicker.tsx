'use client'

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'

type AccentTheme = 'inherit' | 'house-red' | 'field-teal' | 'ink' | 'archive-sepia' | 'forest' | 'slate'

interface AccentOption {
  value: AccentTheme
  label: string
  hex: string
}

const ACCENTS: AccentOption[] = [
  { value: 'inherit', label: 'Inherit from desk', hex: '#e5e7eb' },
  { value: 'house-red', label: 'House red', hex: '#b43d2a' },
  { value: 'field-teal', label: 'Field teal', hex: '#3e6b66' },
  { value: 'ink', label: 'Ink', hex: '#1c1917' },
  { value: 'archive-sepia', label: 'Archive sepia', hex: '#92400e' },
  { value: 'forest', label: 'Forest', hex: '#166534' },
  { value: 'slate', label: 'Slate', hex: '#334155' },
]

export const AccentThemePicker: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<AccentTheme>({ path })
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
      <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 500 }}>
        Accent Color
        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 400 }}>
          {value === 'inherit'
            ? 'Using desk default'
            : `Overriding with ${ACCENTS.find((a) => a.value === value)?.label}`}
        </div>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '0.75rem' }}>
        {ACCENTS.map((accent) => (
          <button
            key={accent.value}
            onClick={() => setValue(accent.value)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              border: value === accent.value ? '3px solid #1f2937' : '2px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                backgroundColor: accent.hex,
                borderRadius: '4px',
                border: accent.value === 'inherit' ? '1px dashed #9ca3af' : 'none',
              }}
            />
            <div style={{ fontSize: '0.7rem', textAlign: 'center', color: '#6b7280' }}>
              {accent.label}
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#fef3c7',
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: '#78350f',
        }}
      >
        💡 The accent colors only the section label and links — not the headline or body text. This maintains editorial restraint.
      </div>
    </div>
  )
}
