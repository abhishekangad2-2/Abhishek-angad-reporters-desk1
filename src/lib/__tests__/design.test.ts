import { describe, it, expect } from 'vitest'
import { resolveDesign, DEFAULT_DESIGN, designCssVars, PALETTE_PRESETS } from '../design'

// resolveDesign guards the homepage: a half-filled or malformed design-studio
// global must never break the landing — every field falls back to a default.
describe('resolveDesign', () => {
  it('returns defaults for null / garbage input', () => {
    expect(resolveDesign(null)).toEqual(DEFAULT_DESIGN)
    expect(resolveDesign('nope')).toEqual(DEFAULT_DESIGN)
    expect(resolveDesign({})).toEqual(DEFAULT_DESIGN)
  })

  it('applies a named palette preset', () => {
    const d = resolveDesign({ palettePreset: 'midnight-wire' })
    expect(d.palette).toEqual(PALETTE_PRESETS['midnight-wire'].palette)
  })

  it('uses custom hexes only when preset is "custom", falling back on bad hex', () => {
    const d = resolveDesign({
      palettePreset: 'custom',
      customPalette: { ink: '#000000', paper: 'not-a-hex', accent: '#abc', dataAccent: '#123456' },
    })
    expect(d.palette.ink).toBe('#000000')
    expect(d.palette.paper).toBe(DEFAULT_DESIGN.palette.paper) // invalid → default
    expect(d.palette.accent).toBe('#abc')
  })

  it('clamps simulation numbers into range and validates kind', () => {
    const d = resolveDesign({
      simulation: { kind: 'bogus', density: 9999, speed: -5, intensity: 42, interactive: false },
    })
    expect(d.simulation.kind).toBe(DEFAULT_DESIGN.simulation.kind)
    expect(d.simulation.density).toBe(200) // clamped max
    expect(d.simulation.speed).toBe(0.2) // clamped min
    expect(d.simulation.intensity).toBe(1) // clamped max
    expect(d.simulation.interactive).toBe(false)
  })

  it('accepts a valid simulation kind', () => {
    expect(resolveDesign({ simulation: { kind: 'waves' } }).simulation.kind).toBe('waves')
  })
})

describe('designCssVars', () => {
  it('emits paper-newsprint tracking the palette paper (newspaper-layout fix)', () => {
    const vars = designCssVars(resolveDesign({ palettePreset: 'midnight-wire' }))
    expect(vars['--paper-newsprint']).toBe(PALETTE_PRESETS['midnight-wire'].palette.paper)
    expect(vars['--paper-cool']).toBe(vars['--paper-newsprint'])
  })
})
