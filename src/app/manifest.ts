import type { MetadataRoute } from 'next'

// Installable web-app manifest. Its purpose is the field-dispatch tool: tapping
// the home-screen icon opens the composer directly (start_url), full-screen
// (standalone). Android reads this; iOS uses the apple-icon + appleWebApp meta
// on the dispatch route itself.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ReportersDesk Wire',
    short_name: 'RD Wire',
    description: 'File a live dispatch to the Reporters Desk wire from your phone.',
    start_url: '/desk/dispatch',
    scope: '/desk/',
    display: 'standalone',
    background_color: '#14171c',
    theme_color: '#14171c',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
