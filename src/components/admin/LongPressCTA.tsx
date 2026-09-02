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
          Publishing a book review for <strong>thelongpress.org</strong>? Start it here — it lives in Stories on
          this same backend and goes live on LongPress once the domain is pointed.
        </div>
      </div>

      {/* POST (not a link) so it creates a draft already filed under Book
          Reviews, then redirects to its edit page — and so admin prefetch can't
          spawn stray drafts. */}
      <form action="/api/desk/new-book-review" method="post" style={{ flex: 'none', margin: 0 }}>
        <button
          type="submit"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1rem',
            borderRadius: 6,
            border: 'none',
            background: INK,
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ＋ New book review → publish with LongPress
        </button>
      </form>
    </div>
  )
}
