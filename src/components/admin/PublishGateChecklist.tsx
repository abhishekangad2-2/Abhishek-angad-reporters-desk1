'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

interface PublishGateChecklistProps {
  section?: string
  editorialReview?: {
    factChecked?: boolean
    legallyReviewed?: boolean
  }
}

export const PublishGateChecklist: React.FC<PublishGateChecklistProps> = ({ section, editorialReview }) => {
  // Only show gate for Accountability and Investigative sections
  const requiresGate = useMemo(() => {
    return section === 'accountability' || section === 'investigative'
  }, [section])

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  if (!requiresGate) {
    return (
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#f0fdf4',
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#166534',
        }}
      >
        ✓ This section does not require fact-check or legal review before publishing.
      </div>
    )
  }

  const factChecked = editorialReview?.factChecked ?? false
  const legallyReviewed = editorialReview?.legallyReviewed ?? false
  const allClear = factChecked && legallyReviewed

  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: allClear ? '#f0fdf4' : '#fef2f2',
        borderRadius: '6px',
        borderLeft: `4px solid ${allClear ? '#166534' : '#b43d2a'}`,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: allClear ? '#166534' : '#7f1d1d' }}>
        {allClear ? '✓ Ready to publish' : '⚠ Publishing requirements'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={factChecked} disabled style={{ cursor: 'pointer' }} />
          <span style={{ color: factChecked ? '#166534' : '#6b7280' }}>Fact-checked by reporter</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={legallyReviewed} disabled style={{ cursor: 'pointer' }} />
          <span style={{ color: legallyReviewed ? '#166534' : '#6b7280' }}>Legally reviewed</span>
        </label>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#6b7280' }}>
        This story is in the <strong>{section}</strong> section. Check both boxes in the sidebar to enable publishing.
      </div>
    </div>
  )
}
