'use client'

/**
 * Visual thumbnail picker for the Stories `layout_type` field, now with a live
 * AI Layout Co-Pilot.
 *
 * VALUE SCHEME: keeps `template_1..template_4` — these are the values the
 * `layout_type` select stores and that `src/app/[section]/[slug]/page.tsx`
 * switches on to render the story. Do NOT change them.
 *
 * CO-PILOT: after mount (and whenever the block composition changes) it derives
 * block counts best-effort from form state and POSTs them to
 * `/api/ai/layout-suggest` -> { layout: three-column|z-pattern|newspaper|
 * immersive, reason }. The returned layout is mapped onto the matching
 * template_N choice, which gets the existing "AI rec" badge, and the reason is
 * shown below the grid.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useField, useAllFormFields } from '@payloadcms/ui'
import { LayoutThumbGrid, type LayoutChoice } from './LayoutThumb'

const CHOICES: LayoutChoice[] = [
  { value: 'template_1', label: 'Z-Axis', shape: 'z' },
  { value: 'template_2', label: 'X/Y rows', shape: 'xy' },
  { value: 'template_3', label: 'Newspaper', shape: 'np' },
  { value: 'template_4', label: 'Immersive', shape: 'im' },
]

// API layout value -> our template_N value.
const API_TO_TEMPLATE: Record<string, string> = {
  'three-column': 'template_1',
  'z-pattern': 'template_2',
  newspaper: 'template_3',
  immersive: 'template_4',
}

type BlockCounts = {
  text: number
  image: number
  gallery: number
  video: number
  audio: number
  quote: number
  data: number
}

// Map a Payload block `blockType` to one of the seven semantic buckets the
// layout-suggest endpoint understands. Counts media sub-fields where relevant.
function bucketFor(blockType: string): Partial<BlockCounts> {
  switch (blockType) {
    case 'Prose':
      return { text: 1 }
    case 'SinglePicture':
    case 'FullBleedImage':
    case 'RedactedDocument':
      return { image: 1 }
    case 'TextPhoto':
      return { text: 1, image: 1 }
    case 'Diptych':
    case 'ImageComparison':
      return { image: 2 }
    case 'GalleryAudioVideo':
      return { gallery: 1 }
    case 'VideoEmbed':
      return { video: 1 }
    case 'AudioClip':
      return { audio: 1 }
    case 'PullQuote':
      return { quote: 1 }
    case 'StatHighlight':
    case 'Timeline':
      return { data: 1 }
    default:
      return {}
  }
}

export const LayoutPicker: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const [fields] = useAllFormFields()

  const [recommended, setRecommended] = useState<string | null>(null)
  const [reason, setReason] = useState<string | null>(null)

  // Derive block counts from the `layout` (and `visualMedia`) blocks arrays in
  // form state. Block rows expose a `blockType` value at `<array>.<i>.blockType`.
  const counts = useMemo<BlockCounts>(() => {
    const acc: BlockCounts = { text: 0, image: 0, gallery: 0, video: 0, audio: 0, quote: 0, data: 0 }
    try {
      for (const [key, field] of Object.entries(fields || {})) {
        if (!key.endsWith('.blockType')) continue
        if (!key.startsWith('layout.') && !key.startsWith('visualMedia.')) continue
        const blockType = (field as { value?: unknown })?.value
        if (typeof blockType !== 'string') continue
        const bucket = bucketFor(blockType)
        for (const [k, v] of Object.entries(bucket)) {
          acc[k as keyof BlockCounts] += v || 0
        }
      }
    } catch {
      /* best-effort; fall through with whatever we accumulated */
    }
    return acc
  }, [fields])

  // Re-query the co-pilot whenever the composition changes.
  const countsKey = JSON.stringify(counts)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch('/api/ai/layout-suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blocks: counts }),
        })
        const data = await res.json()
        if (cancelled) return
        const tpl = API_TO_TEMPLATE[data?.layout] ?? null
        setRecommended(tpl)
        setReason(typeof data?.reason === 'string' ? data.reason : null)
      } catch {
        /* never crash the editor on a co-pilot fetch failure */
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countsKey])

  const choices = useMemo(
    () => CHOICES.map((c) => ({ ...c, recommended: c.value === recommended })),
    [recommended],
  )

  return (
    <div>
      <LayoutThumbGrid
        title="Presentation Template"
        description="Click a layout to set how this story is presented."
        choices={choices}
        value={value}
        onChange={setValue}
      />
      {recommended && reason && (
        <div
          style={{
            marginTop: '0.6rem',
            padding: '0.6rem 0.75rem',
            background: 'rgba(210,74,50,0.12)',
            border: '1px solid rgba(210,74,50,0.4)',
            borderRadius: '6px',
            fontSize: '0.78rem',
            color: '#f5f3ec',
          }}
        >
          <strong style={{ color: '#d24a32' }}>AI rec:</strong>{' '}
          {CHOICES.find((c) => c.value === recommended)?.label} — {reason}
        </div>
      )}
    </div>
  )
}
