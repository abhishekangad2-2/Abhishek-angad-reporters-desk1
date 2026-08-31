import type { Metadata } from 'next'

// The founder page itself is a client component (scroll animation), so its
// per-route metadata lives here in a server layout.
const DESCRIPTION =
  'Abhishek Angad — ground reportage from Jharkhand and eastern India, accountability journalism, and the reader-funded home for it: ReportersDesk.'

export const metadata: Metadata = {
  title: 'The Founder',
  description: DESCRIPTION,
  alternates: { canonical: '/founder' },
  openGraph: {
    type: 'profile',
    title: 'The Founder · ReportersDesk',
    description: DESCRIPTION,
    url: 'https://reporters-desk.org/founder',
    siteName: 'ReportersDesk',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Founder · ReportersDesk',
    description: DESCRIPTION,
    images: ['/og-default.jpg'],
  },
}

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return children
}
