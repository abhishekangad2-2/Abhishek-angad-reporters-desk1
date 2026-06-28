'use client'

/**
 * AI caption co-pilot for image-block caption fields.
 *
 * Renders a small "Suggest caption (AI)" button alongside a caption text field.
 * It locates the sibling `image` upload's URL from form state, POSTs it to
 * `/api/ai/caption` -> { configured, caption, focalPoint }, and on success
 * (configured: true) writes the returned caption into THIS field via useField.
 * When the Vision API isn't configured (configured: false) it shows the note
 * text and writes nothing.
 *
 * Registered as the caption field's admin Field component for the SinglePicture
 * and TextPhoto blocks in src/collections/Stories.ts.
 */

import React, { useState } from 'react'
import { useField, useAllFormFields } from '@payloadcms/ui'

// Walk up from the caption path to the block row, then look for a sibling
// `image` field's value. Block rows look like `layout.2.image`; the caption is
// `layout.2.caption`, so we swap the leaf.
function siblingImagePath(captionPath: string): string {
  if (!captionPath.includes('.')) return 'image'
  return captionPath.slice(0, captionPath.lastIndexOf('.') + 1) + 'image'
}

// Upload values in Payload form state can be an id, or a populated doc with a
// `url`. Try to resolve a usable URL.
function resolveImageUrl(fieldValue: unknown): string | null {
  if (!fieldValue) return null
  if (typeof fieldValue === 'string') return null // bare id — no URL available client-side
  if (typeof fieldValue === 'object') {
    const v = fieldValue as Record<string, unknown>
    if (typeof v.url === 'string') return v.url
    if (typeof v.thumbnailURL === 'string') return v.thumbnailURL
  }
  return null
}

export const CaptionSuggester: React.FC<{ path: string }> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const [fields] = useAllFormFields()

  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const suggest = async () => {
    setLoading(true)
    setNote(null)
    try {
      const imgPath = siblingImagePath(path)
      const imageField = fields?.[imgPath]
      const imageUrl = resolveImageUrl(imageField?.value)

      const res = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageUrl || '' }),
      })
      const data = await res.json()

      if (data?.configured === false) {
        setNote(data?.note || 'AI caption service is not configured.')
        return
      }
      if (data?.caption) {
        setValue(String(data.caption))
        setNote('Caption suggested by Vision AI — edit as needed.')
      } else {
        setNote(
          imageUrl
            ? 'No caption could be derived from this image.'
            : 'Pick an image first so the AI has something to caption.',
        )
      }
    } catch {
      setNote('Could not reach the caption service.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>Caption</label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Caption"
          style={{
            flex: 1,
            padding: '0.5rem 0.6rem',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            fontSize: '0.9rem',
          }}
        />
        <button
          type="button"
          onClick={suggest}
          disabled={loading}
          style={{
            flexShrink: 0,
            border: '1px solid #4f8b83',
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #4f8b83, #2f5651)',
            color: '#fff',
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            cursor: loading ? 'default' : 'pointer',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Suggesting…' : 'Suggest caption (AI)'}
        </button>
      </div>
      {note && <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#6b7280' }}>{note}</div>}
    </div>
  )
}
