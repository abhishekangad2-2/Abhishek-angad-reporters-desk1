'use client'

// A quick-action banner rendered above the Stories list (collection
// admin.components.beforeListTable). LongPress is Reporters Desk's book-review
// imprint — a separate site (thelongpress.org) that runs on this same Payload
// backend. This gives an editor a one-click way to start a book review and
// publish it under the LongPress banner, without leaving the Stories section.
// No schema change: book reviews are ordinary stories, distinguished by their
// section; thelongpress.org will serve those once its domain is pointed here.

import React from 'react'

const INK = '#1f2a44' // LongPress deep-ink, distinct from Reporters Desk red

export function LongPressCTA() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.9rem 1.4rem',
        margin: '0 0 1.25rem',
        padding: '0.9rem 1.15rem',
        border: '1px solid var(--theme-elevation-150)',
        borderLeft: `3px solid ${INK}`,
        borderRadius: 8,
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--theme-elevation-500)',
            marginBottom: 3,
          }}
        >
          LongPress · Book reviews
        </div>
        <div style={{ fontSize: '0.9rem', lineHeight: 1.4, color: 'var(--theme-text)' }}>
          Publishing a book review for <strong>thelongpress.org</strong>? Start a new story here and set its{' '}
          <strong>Section → Book Reviews</strong> — it lives in Stories on this same backend and surfaces on
          Reporters Desk and thelongpress.org automatically.
        </div>
      </div>

      {/* Plain link to the native create form — reliable, creates nothing until
          the editor saves. (Payload can't pre-fill a blank form's Section, so
          it's a one-tap dropdown choice.) */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/cms/collections/stories/create"
        style={{
          flex: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.6rem 1rem',
          borderRadius: 6,
          background: INK,
          color: '#fff',
          fontSize: '0.8rem',
          fontWeight: 600,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        ＋ New book review
      </a>
    </div>
  )
}
