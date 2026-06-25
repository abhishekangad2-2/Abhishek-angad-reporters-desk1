'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'

type LayoutTemplate = 'template_1' | 'template_2' | 'template_3' | 'template_4'

interface LayoutOption {
  value: LayoutTemplate
  label: string
  description: string
  icon: string // Emoji representation
}

const LAYOUTS: LayoutOption[] = [
  {
    value: 'template_1',
    label: 'Three-Column',
    description: 'Discovery layout with three equal lead stories',
    icon: '📊',
  },
  {
    value: 'template_2',
    label: 'Z-Pattern',
    description: 'Guided read with alternating image/text rows',
    icon: '↖️',
  },
  {
    value: 'template_3',
    label: 'Newspaper',
    description: 'Authority layout with lead + rail grid',
    icon: '📰',
  },
  {
    value: 'template_4',
    label: 'Immersive',
    description: 'Scrollytelling with dark, full-bleed sections',
    icon: '🎬',
  },
]

export const LayoutPicker: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<LayoutTemplate>({ path })

  return (
    <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
      <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>
        Presentation Template
      </label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {LAYOUTS.map((layout) => (
          <button
            key={layout.value}
            onClick={() => setValue(layout.value)}
            style={{
              padding: '1rem',
              border: value === layout.value ? '2px solid #b43d2a' : '2px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: value === layout.value ? '#fef2f2' : '#fff',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s',
              fontSize: '2.5rem',
              lineHeight: 1,
              marginBottom: '0.5rem',
            }}
          >
            {layout.icon}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {LAYOUTS.map((layout) => (
          <div key={`label-${layout.value}`} style={{ fontSize: '0.85rem' }}>
            <div
              style={{
                fontWeight: value === layout.value ? 600 : 400,
                color: value === layout.value ? '#b43d2a' : '#374151',
              }}
            >
              {layout.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              {layout.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
