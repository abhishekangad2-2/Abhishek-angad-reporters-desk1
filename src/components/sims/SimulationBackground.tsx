'use client'

// The switcher between landing background simulations. Landing layouts render
// THIS (never a sim directly); the editor's Design Studio config decides which
// sim runs and how it's tuned. Adding a sim = one file in ./ implementing
// SimulationProps + one REGISTRY entry.

import React from 'react'
import type { DesignConfig } from '../../lib/design'
import { DEFAULT_DESIGN, simColors } from '../../lib/design'
import PlexusBackground from '../PlexusBackground'
import type { SimulationProps } from './types'

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

// particles / waves / constellation alias to Plexus (tuned differently) until
// their dedicated implementations land — the editor's choice always renders
// SOMETHING coherent rather than a blank page.
const REGISTRY: Record<string, React.ComponentType<SimulationProps>> = {
  plexus: PlexusAdapter,
  particles: PlexusAdapter,
  waves: PlexusAdapter,
  constellation: PlexusAdapter,
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
  if (d.simulation.kind === 'off') return null

  const Sim = REGISTRY[d.simulation.kind] ?? PlexusAdapter
  const colors = simColors(d)

  const props: SimulationProps = {
    className,
    density: Math.max(12, Math.round(d.simulation.density * densityScale)),
    speed: d.simulation.speed,
    intensity: Math.min(1, d.simulation.intensity * intensityScale),
    primary: colors.primary,
    secondary: colors.secondary,
    interactive: d.simulation.interactive,
    focusIndex: focusIndex ?? null,
    ...overrides,
  }

  return <Sim {...props} />
}
