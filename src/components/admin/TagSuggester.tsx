'use client'

/**
 * AI tag co-pilot for the Stories `readDeeper.suggestedTags` field.
 *
 * Reads the story's headline + strap from form state (best-effort) and POSTs
 * to `/api/ai/tags` -> { suggestions: string[] }. Renders the returned
 * suggestions as clickable chips. Clicking a chip appends it to the sibling
 * `suggestedTags` select (only values that exist in the field's option list
 * are auto-added; the rest are still shown so the editor can act on them).
 *
 * Registered as a UI field via importMap; rendered just above the
 * `suggestedTags` select in src/collections/Stories.ts.
 */

import React, { useEffect, useState } from 'react'
import { useField, useAllFormFields } from '@payloadcms/ui'

// The fixed option values supported by the `suggestedTags` select. Keep in sync
// with Stories.ts. Anything outside this set can't be written to the field, so
// we only auto-add matches and otherwise just display the suggestion.
const VALID_TAG_VALUES = ['corruption', 'environment', 'healthcare', 'politics', 'law', 'economy']

// Map a free-text suggestion from the NLP endpoint onto one of the select's
// option values, when there's an obvious keyword overlap.
const SUGGESTION_ALIASES: Record<string, string> = {
  governance: 'corruption',
  'follow the money': 'corruption',
  'where was your money spent': 'corruption',
  climate: 'environment',
  'climate change': 'environment',
  renewables: 'environment',
  'access to public health': 'healthcare',
  'disease burden': 'healthcare',
  'criminal justice system': 'law',
  'legislature and laws': 'law',
  'political economy': 'economy',
  'labour-wages-markets': 'economy',
  'politics and politicians': 'politics',
  'national politics': 'politics',
  'state politics': 'politics',
  'local-level politics': 'politics',
}

function toFieldValue(suggestion: string): string | null {
  const s = suggestion.toLowerCase().trim()
  if (VALID_TAG_VALUES.includes(s)) return s
  if (SUGGESTION_ALIASES[s]) return SUGGESTION_ALIASES[s]
  // last-ditch: substring match against valid values
  const hit = VALID_TAG_VALUES.find((v) => s.includes(v) || v.includes(s))
  return hit ?? null
}

export const TagSuggester: React.FC<{ path: string }> = ({ path }) => {
  // `path` points at this UI field (e.g. readDeeper.tagSuggester). The select we
  // write into is its sibling readDeeper.suggestedTags.
  const siblingPath = path.includes('.')
    ? path.slice(0, path.lastIndexOf('.') + 1) + 'suggestedTags'
    : 'suggestedTags'

  const { value: tagsValue, setValue: setTags } = useField<string[]>({ path: siblingPath })
  const [fields] = useAllFormFields()

  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [note, setNote] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const readText = (): string => {
    try {
      const headline = (fields?.headline?.value as string) || ''
      const strap = (fields?.strap?.value as string) || ''
      const caption = (fields?.caption?.value as string) || ''
      return [headline, strap, caption].filter(Boolean).join('. ')
    } catch {
      return ''
    }
  }

  const fetchSuggestions = async () => {
    setLoading(true)
    setNote(null)
    try {
      const text = readText()
      if (!text.trim()) {
        setSuggestions([])
        setNote('Add a headline or strap first, then suggest tags.')
        return
      }
      const res = await fetch('/api/ai/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      const out: string[] = Array.isArray(data?.suggestions) ? data.suggestions : []
      setSuggestions(out)
      if (!out.length) setNote('No tag suggestions for the current text.')
    } catch {
      setNote('Could not reach the tag suggestion service.')
    } finally {
      setLoading(false)
    }
  }

  const addTag = (suggestion: string) => {
    const fv = toFieldValue(suggestion)
    if (!fv) {
      setNote(`"${suggestion}" has no matching tag option — add it manually below.`)
      return
    }
    const current = Array.isArray(tagsValue) ? tagsValue : []
    if (current.includes(fv)) return
    setTags([...current, fv])
  }

  if (!mounted) return null

  return (
    <div style={{ padding: '1rem', background: '#0e1115', borderRadius: '8px', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <label style={{ fontWeight: 500, color: '#f5f3ec' }}>
          🏷️ AI Tag Suggestions
          <div style={{ fontSize: '0.8rem', color: 'rgba(245,243,236,0.6)', marginTop: '0.25rem', fontWeight: 400 }}>
            Suggests topic tags from the headline & strap. Click a chip to add it.
          </div>
        </label>
        <button
          type="button"
          onClick={fetchSuggestions}
          disabled={loading}
          style={{
            flexShrink: 0,
            border: '1px solid #d24a32',
            background: loading ? '#3a3f47' : 'linear-gradient(135deg, #d24a32, #7a2a1e)',
            color: '#fff',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            cursor: loading ? 'default' : 'pointer',
            fontSize: '0.8rem',
          }}
        >
          {loading ? 'Analyzing…' : 'Suggest tags (AI)'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
          {suggestions.map((s) => {
            const mappable = !!toFieldValue(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                title={mappable ? 'Click to add to tags' : 'No matching tag option'}
                style={{
                  border: '1px solid #4f8b83',
                  background: mappable ? 'rgba(79,139,131,0.18)' : 'rgba(255,255,255,0.04)',
                  color: '#f5f3ec',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  textTransform: 'capitalize',
                  opacity: mappable ? 1 : 0.6,
                }}
              >
                + {s}
              </button>
            )
          })}
        </div>
      )}

      {note && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: 'rgba(245,243,236,0.7)' }}>{note}</div>
      )}
    </div>
  )
}
