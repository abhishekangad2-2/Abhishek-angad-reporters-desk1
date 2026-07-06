'use client'

// Publish-gate checklist, shown in beforeDocumentControls on the Stories edit
// view. It reads the LIVE form state (useAllFormFields) — beforeDocumentControls
// components are NOT passed field values as props, so the previous prop-based
// version always rendered the green "no review required" state, even for
// accountability/investigative stories the server actually blocks.
//
// The enforcing rule (Stories beforeChange hook) requires factChecked +
// legallyReviewed before a story in the accountability-journalism /
// investigative-journalism desks can be published. We can't resolve the section
// relationship id → slug on the client, so we always surface the two review
// flags accurately and note when they're mandatory, rather than guess.

import React, { useEffect, useState } from 'react'
import { useAllFormFields } from '@payloadcms/ui'

export const PublishGateChecklist: React.FC = () => {
  const [fields] = useAllFormFields()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const factChecked = Boolean(fields?.['editorialReview.factChecked']?.value)
  const legallyReviewed = Boolean(fields?.['editorialReview.legallyReviewed']?.value)
  const allClear = factChecked && legallyReviewed

  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: allClear ? '#f0fdf4' : '#fef2f2',
        borderRadius: '6px',
        borderLeft: `4px solid ${allClear ? '#166534' : '#b43d2a'}`,
        marginBottom: '0.75rem',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: allClear ? '#166534' : '#7f1d1d' }}>
        {allClear ? '✓ Editorial review complete' : '⚠ Editorial review'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input type="checkbox" checked={factChecked} disabled readOnly />
          <span style={{ color: factChecked ? '#166534' : '#6b7280' }}>Fact-checked by reporter</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input type="checkbox" checked={legallyReviewed} disabled readOnly />
          <span style={{ color: legallyReviewed ? '#166534' : '#6b7280' }}>Legally reviewed</span>
        </label>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#6b7280' }}>
        Both are <strong>required</strong> before publishing in the Accountability and Investigative
        desks. Set them in the sidebar’s Editorial Review group.
      </div>
    </div>
  )
}
