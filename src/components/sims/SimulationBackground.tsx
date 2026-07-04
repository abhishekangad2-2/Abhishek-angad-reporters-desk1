'use client'

// The switcher between landing background simulations. Landing layouts render
// THIS (never a sim directly); the editor's Design Studio config decides which
// sim runs and how it's tuned. Adding a sim = one file in ./ implementing
// SimulationProps + one REGISTRY entry.

import React from 'react'
import type { DesignConfig } from '../../lib/design'
import { DEFAULT_DESIGN, simColors } from '../../lib/design'
import { useReaderPrefs } from '../../lib/readerPrefs'
import PlexusBackground from '../PlexusBackground'
import Constellation from './Constellation'
import ParticleField from './ParticleField'
import type { SimulationProps } from './types'
import WaveField from './WaveField'

// Plexus predates the SimulationProps contract — adapt at the boundary.
function PlexusAdapter(props: SimulationProps) {
  return (
    <PlexusBackground
      className={props.className}
      nodeCount={props.density}
      color={props.primary}
      lineColor={props.secondary}
      intensity={props.intensity}
      focusIndex={props.interactive ? props.focusIndex : null}
    />
  )
}

const REGISTRY: Record<string, React.ComponentType<SimulationProps>> = {
  plexus: PlexusAdapter,
  particles: ParticleField,
  waves: WaveField,
  constellation: Constellation,
}

export default function SimulationBackground({
  design,
  className,
  focusIndex,
  densityScale = 1,
  intensityScale = 1,
  overrides,
}: {
  design?: DesignConfig
  className?: string
  focusIndex?: number | null
  /** Per-layout character: scales the editor's density (newspaper band ≪ full-bleed grid). */
  densityScale?: number
  /** Per-layout character: scales the editor's intensity. */
  intensityScale?: number
  /** Last-word overrides for layout-specific needs (e.g. immersive's scroll-driven intensity). */
  overrides?: Partial<SimulationProps>
}) {
  const d = design ?? DEFAULT_DESIGN
  // Reader accessibility gear (spec): explicit disable-3D / motion-off kill the
  // WebGL layer entirely; "subtle" and Low-Power damp it. The page is designed
  // HTML-first, so returning null degrades cleanly.
  const reader = useReaderPrefs()
  if (d.simulation.kind === 'off' || reader.disable3d || reader.motion === 'off') return null

  const Sim = REGISTRY[d.simulation.kind] ?? PlexusAdapter
  const colors = simColors(d)

  const subtle = reader.motion === 'subtle'
  const lowPower = reader.lowPower
  const readerDensity = lowPower ? 0.4 : 1
  const readerIntensity = (subtle ? 0.55 : 1) * (lowPower ? 0.8 : 1)
  const readerSpeed = (subtle ? 0.6 : 1) * (lowPower ? 0.7 : 1)

  const props: SimulationProps = {
    className,
    density: Math.max(12, Math.round(d.simulation.density * densityScale * readerDensity)),
    speed: d.simulation.speed * readerSpeed,
    intensity: Math.min(1, d.simulation.intensity * intensityScale * readerIntensity),
    primary: colors.primary,
    secondary: colors.secondary,
    interactive: d.simulation.interactive && !lowPower && !subtle,
    focusIndex: focusIndex ?? null,
    ...overrides,
  }

  return <Sim {...props} />
}
