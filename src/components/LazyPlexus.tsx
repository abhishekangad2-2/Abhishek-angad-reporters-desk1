'use client'

// Lazy, client-only PlexusBackground. Story templates + section hubs render a
// plexus behind the content, but three.js/@react-three/fiber (~tens of MB of
// source) should NOT sit in every story route's initial bundle. Wrapping the
// import in next/dynamic({ ssr: false }) splits the WebGL runtime into its own
// async chunk that loads on the client after mount — the plexus is decorative,
// so nothing is lost by skipping it during SSR. Landings keep the direct import
// (they are WebGL-first by design).

import dynamic from 'next/dynamic'

const LazyPlexus = dynamic(() => import('./PlexusBackground'), { ssr: false })

export default LazyPlexus
