// Branded replacements for Payload's default admin graphics (the generic
// hexagon logo + "Dashboard" nav mark). No hooks needed, so these render as
// plain server components — zero extra client JS.
//
// Wired in payload.config.ts under admin.components.graphics.{Icon,Logo}.

import React from 'react'

const PLAYFAIR_LINK = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,600&display=swap'

/** Full lockup — shown large on the /cms login screen. Mirrors the public
 *  masthead: "Reporters Desk" bold, "Abhishek Angad (Ink)" italic red below. */
export function AdminLogo() {
  return (
    <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
      <link rel="stylesheet" href={PLAYFAIR_LINK} />
      <div
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 900,
          fontSize: '2.1rem',
          letterSpacing: '-0.015em',
          lineHeight: 1,
        }}
      >
        Reporters Desk
      </div>
      <div
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '0.95rem',
          marginTop: '0.35rem',
        }}
      >
        Abhishek Angad{' '}
        <em style={{ fontStyle: 'italic', color: '#b43d2a' }}>INK</em>
      </div>
    </div>
  )
}

/** Compact mark — shown small in the nav rail. Just the monogram so it stays
 *  legible at icon size. */
export function AdminIcon() {
  return (
    <div
      style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontWeight: 900,
        fontSize: '1.15rem',
        color: '#b43d2a',
        lineHeight: 1,
      }}
    >
      RD
    </div>
  )
}
