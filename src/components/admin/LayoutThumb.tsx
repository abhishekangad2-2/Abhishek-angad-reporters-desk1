'use client'

/**
 * Shared visual mini-mockup thumbnails for the four HRIE layouts, ported from
 * the AEC static prototype (aec.css `.aec-thumb`/`.aec-mini` + editor.html
 * `#copilot`). Used by both the Stories `layout_type` picker (values
 * `template_1..4`) and the Integrations `landingLayout` picker (values
 * `three-column | z-pattern | newspaper | immersive`).
 *
 * Each picker maps its own value strings to one of four canonical SHAPES:
 *   z  = Z-Axis      → 3 columns of stacked blocks
 *   xy = X/Y rows    → stacked horizontal rows of blocks
 *   np = Newspaper   → one large lead block + a side column of small blocks
 *   im = Immersive   → a single full block with a centred title bar
 */

import React from 'react'

export type LayoutShape = 'z' | 'xy' | 'np' | 'im'

export const BRAND = {
  ink: '#14171c',
  paper: '#f5f3ec',
  accent: '#d24a32',
  teal: '#4f8b83',
} as const

export interface LayoutChoice {
  /** The string actually stored in the field (e.g. `template_1` or `three-column`). */
  value: string
  /** Short uppercase label shown under the thumbnail. */
  label: string
  /** Which mini-mockup to draw. */
  shape: LayoutShape
  /** Optional: render the "AI rec" badge on this thumbnail. */
  recommended?: boolean
}

const block = (accent = false): React.CSSProperties => ({
  flex: 1,
  borderRadius: '1px',
  background: accent
    ? `linear-gradient(135deg, ${BRAND.accent}, #7a2a1e)`
    : 'linear-gradient(135deg, #3a3f47, #20242a)',
})

const Mini: React.FC<{ shape: LayoutShape }> = ({ shape }) => {
  const base: React.CSSProperties = {
    height: '56px',
    borderRadius: '3px',
    overflow: 'hidden',
    display: 'flex',
    gap: '2px',
    padding: '3px',
    background: '#07080a',
  }

  if (shape === 'z') {
    return (
      <div style={base}>
        {[
          [false, true],
          [true, false],
          [false, false],
        ].map((col, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {col.map((acc, j) => (
              <div key={j} style={block(acc)} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (shape === 'xy') {
    return (
      <div style={{ ...base, flexDirection: 'column' }}>
        {[
          [false, true, false],
          [true, false, false],
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '2px', flex: 1 }}>
            {row.map((acc, j) => (
              <div key={j} style={block(acc)} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (shape === 'np') {
    return (
      <div style={base}>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={block(true)} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={block(false)} />
          <div style={block(false)} />
        </div>
      </div>
    )
  }

  // im
  return (
    <div style={{ ...base, padding: 0 }}>
      <div
        style={{
          flex: 1,
          background: 'radial-gradient(circle at 50% 30%, #2a3640, #0e1115)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '60%',
            height: '8px',
            background: 'rgba(245,243,236,0.5)',
            borderRadius: '2px',
          }}
        />
      </div>
    </div>
  )
}

export const LayoutThumb: React.FC<{
  choice: LayoutChoice
  selected: boolean
  onSelect: () => void
}> = ({ choice, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    style={{
      position: 'relative',
      border: selected ? `1px solid ${BRAND.accent}` : '1px solid #2a2f37',
      boxShadow: selected ? `0 0 0 1px ${BRAND.accent}` : 'none',
      borderRadius: '6px',
      padding: '0.5rem',
      cursor: 'pointer',
      background: '#0e1115',
      textAlign: 'left',
      transition: 'border-color .2s, transform .2s',
    }}
  >
    {choice.recommended && (
      <span
        style={{
          position: 'absolute',
          top: '-8px',
          right: '-6px',
          fontFamily: 'monospace',
          fontSize: '0.46rem',
          background: BRAND.accent,
          color: '#fff',
          padding: '2px 5px',
          borderRadius: '10px',
          letterSpacing: '0.04em',
        }}
      >
        AI rec
      </span>
    )}
    <Mini shape={choice.shape} />
    <span
      style={{
        fontFamily: 'monospace',
        fontSize: '0.52rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: selected ? BRAND.accent : BRAND.paper,
        marginTop: '0.4rem',
        display: 'block',
      }}
    >
      {choice.label}
    </span>
  </button>
)

export const LayoutThumbGrid: React.FC<{
  title: string
  description?: string
  choices: LayoutChoice[]
  value: string | undefined
  onChange: (v: string) => void
}> = ({ title, description, choices, value, onChange }) => (
  <div style={{ padding: '1rem', background: BRAND.ink, borderRadius: '8px' }}>
    <label
      style={{
        display: 'block',
        marginBottom: '0.75rem',
        fontWeight: 500,
        color: BRAND.paper,
      }}
    >
      {title}
      {description && (
        <div
          style={{
            fontSize: '0.8rem',
            color: 'rgba(245,243,236,0.6)',
            marginTop: '0.25rem',
            fontWeight: 400,
          }}
        >
          {description}
        </div>
      )}
    </label>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.6rem',
      }}
    >
      {choices.map((choice) => (
        <LayoutThumb
          key={choice.value}
          choice={choice}
          selected={value === choice.value}
          onSelect={() => onChange(choice.value)}
        />
      ))}
    </div>
  </div>
)
