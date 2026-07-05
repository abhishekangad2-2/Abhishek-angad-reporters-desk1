'use client'

// Global admin aesthetic layer. Registered as an admin `providers` component so
// it wraps every CMS page. Payload's default admin is monochrome; this adds the
// ReportersDesk house-red accent (active nav, primary buttons, links, focus) and
// polishes the dashboard collection cards (hover lift + accent edge). Pure CSS
// injection — no behaviour change.

import React from 'react'

const ACCENT = '#b43d2a'
const ACCENT_HOVER = '#9a3423'

const CSS = `
:root {
  --rd-accent: ${ACCENT};
  --rd-accent-hover: ${ACCENT_HOVER};
}

/* Primary actions in the house red instead of near-black. */
.btn--style-primary,
.btn--style-primary:hover {
  background-color: var(--rd-accent);
  border-color: var(--rd-accent);
}
.btn--style-primary:hover { background-color: var(--rd-accent-hover); }

/* Active / hovered nav items pick up the accent + a red spine. */
.nav__link:hover { color: var(--rd-accent); }
.nav .nav__link.active,
.nav__link[aria-current='page'] {
  color: var(--rd-accent);
  box-shadow: inset 3px 0 0 var(--rd-accent);
}

/* Dashboard collection / global cards: gentle lift + accent edge on hover so the
   grid feels tactile instead of flat. */
.dashboard .card,
.card {
  transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}
.dashboard .card:hover,
.card:hover {
  transform: translateY(-2px);
  border-color: var(--rd-accent);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}

/* The "+ create" affordance on each card in the accent. */
.dashboard .card a[href*='create'],
.card .btn svg { color: var(--rd-accent); }

/* Section-group headings (Newsroom / System / …) — a small accent tick. */
.dashboard__group-name,
.dashboard h2 {
  position: relative;
  padding-left: 0.7rem;
}
.dashboard__group-name::before,
.dashboard h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.2em;
  bottom: 0.2em;
  width: 3px;
  border-radius: 2px;
  background: var(--rd-accent);
}

/* Links + focus rings in the accent. */
.doc-controls a:hover,
.collection-list a:hover,
a.step-nav__link:hover { color: var(--rd-accent); }
*:focus-visible { outline-color: var(--rd-accent) !important; }
`

export function AdminStyles({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {children}
    </>
  )
}
