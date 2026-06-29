'use client'

/**
 * Visual thumbnail picker for the Integrations `landingLayout` field
 * (Appearance tab) — the HRIE layout the public homepage renders.
 *
 * VALUE SCHEME: keeps `three-column | z-pattern | newspaper | immersive`
 * (the `LandingTemplate` values in src/lib/landing.ts). `landing.server.ts`
 * reads this value directly, so it must not change.
 */

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'
import { LayoutThumbGrid, type LayoutChoice } from './LayoutThumb'

const CHOICES: LayoutChoice[] = [
  { value: 'three-column', label: 'Z-Axis', shape: 'z' },
  { value: 'z-pattern', label: 'X/Y rows', shape: 'xy' },
  { value: 'newspaper', label: 'Newspaper', shape: 'np' },
  { value: 'immersive', label: 'Immersive', shape: 'im' },
]

export const LandingLayoutPicker: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <LayoutThumbGrid
      title="Homepage layout"
      description="Set by the Layout Co-Pilot. ?layout= still overrides for preview."
      choices={CHOICES}
      value={value}
      onChange={setValue}
    />
  )
}
