'use client'

/**
 * Visual thumbnail picker for the Stories `layout_type` field.
 *
 * VALUE SCHEME: keeps `template_1..template_4` — these are the values the
 * `layout_type` select stores and that `src/app/[section]/[slug]/page.tsx`
 * switches on to render the story. Do NOT change them.
 */

import React from 'react'
import { useField } from '@payloadcms/ui'
import { LayoutThumbGrid, type LayoutChoice } from './LayoutThumb'

const CHOICES: LayoutChoice[] = [
  { value: 'template_1', label: 'Z-Axis', shape: 'z' },
  { value: 'template_2', label: 'X/Y rows', shape: 'xy' },
  { value: 'template_3', label: 'Newspaper', shape: 'np' },
  { value: 'template_4', label: 'Immersive', shape: 'im', recommended: true },
]

export const LayoutPicker: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })

  return (
    <LayoutThumbGrid
      title="Presentation Template"
      description="Click a layout to set how this story is presented."
      choices={CHOICES}
      value={value}
      onChange={setValue}
    />
  )
}
