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

/* Dashboard collection / global cards: gentle lift + a top accent bar that
   wipes in on hover, so the grid feels tactile and branded instead of flat. */
.dashboard .card,
.card {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}
.dashboard .card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--rd-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.22s ease;
}
.dashboard .card:hover,
.card:hover {
  transform: translateY(-3px);
  border-color: var(--rd-accent);
  box-shadow: 0 10px 26px -8px rgba(0, 0, 0, 0.28);
}
.dashboard .card:hover::before { transform: scaleX(1); }

/* Stronger card titles — the default is a touch anaemic. */
.dashboard .card .card__title,
.dashboard .card h3,
.card__title {
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* The "+ create" affordance on each card in the accent. */
.dashboard .card a[href*='create'],
.card .btn svg { color: var(--rd-accent); }

/* Section-group headings (Newsroom / System / …) — larger, spaced, accent tick. */
.dashboard__group-name,
.dashboard h2 {
  position: relative;
  padding-left: 0.75rem;
  margin-top: 1.6rem;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.dashboard__group-name::before,
.dashboard h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.15em;
  bottom: 0.15em;
  width: 3px;
  border-radius: 2px;
  background: var(--rd-accent);
}

/* ---------- Dashboard welcome hero (DashboardWelcome, all roles) ---------- */
.rd-welcome {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem 2rem;
  padding: clamp(1.4rem, 3vw, 2.4rem);
  margin-bottom: 1.6rem;
  border-radius: 14px;
  color: #f6f1e9;
  background:
    radial-gradient(1100px 320px at 10% -30%, rgba(255, 255, 255, 0.16), transparent 60%),
    radial-gradient(560px 300px at 105% 130%, rgba(180, 61, 42, 0.6), transparent 60%),
    linear-gradient(120deg, #221915 0%, #3a201b 46%, #7c2a1d 100%);
  box-shadow: 0 16px 40px -22px rgba(0, 0, 0, 0.65);
}
.rd-welcome::after {
  /* faint dotted "plexus" texture over the gradient */
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1.4px);
  background-size: 26px 26px;
  opacity: 0.22;
  pointer-events: none;
}
.rd-welcome__inner { position: relative; z-index: 1; }
.rd-welcome__eyebrow {
  font-size: 0.66rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #ecbcb0;
}
.rd-welcome__title {
  margin: 0.4rem 0 0;
  font-size: clamp(2rem, 4.4vw, 3.1rem);
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 0.92;
  color: #fff;
}
.rd-welcome__title span { color: #e2705c; }
.rd-welcome__sub {
  margin: 0.55rem 0 0;
  font-size: 0.9rem;
  opacity: 0.88;
}
.rd-welcome__sub em { color: #ec9482; font-style: italic; }
.rd-welcome__meta {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: right;
}
.rd-welcome__hi { font-size: 0.98rem; font-weight: 600; }
.rd-welcome__date {
  font-size: 0.72rem;
  opacity: 0.72;
  letter-spacing: 0.04em;
}
@media (max-width: 640px) {
  .rd-welcome__meta { text-align: left; }
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
