// Design Studio — shared types, palette presets, and helpers.
// Client-safe: NO payload imports (landing components import from here).
// The editor's choices live in the `design-studio` global (src/globals/
// DesignStudio.ts); landing.server.ts resolves them into a DesignConfig.

export type SimulationKind = 'plexus' | 'particles' | 'waves' | 'constellation' | 'off'

export type Palette = {
  /** Primary text / strong UI */
  ink: string
  /** Page background */
  paper: string
  /** Signature accent (leads, alerts, pulse) */
  accent: string
  /** Secondary accent (data desk, chart contexts, sim lines) */
  dataAccent: string
}

export type SimulationConfig = {
  kind: SimulationKind
  /** Node/particle count driver, 20–200 */
  density: number
  /** Animation speed multiplier, 0.2–2 */
  speed: number
  /** Visual strength 0–1 (opacity/brightness) */
  intensity: number
  /** Primary sim color (nodes/particles) — defaults to palette accent */
  primary?: string
  /** Secondary sim color (lines/trails) — defaults to palette dataAccent */
  secondary?: string
  /** React to pointer/card hover */
  interactive: boolean
}

export type DesignConfig = {
  palette: Palette
  simulation: SimulationConfig
}

export type PalettePresetId =
  | 'newsroom-classic'
  | 'midnight-wire'
  | 'archive-sepia'
  | 'forest-ledger'
  | 'high-alert'
  | 'custom'

export const PALETTE_PRESETS: Record<Exclude<PalettePresetId, 'custom'>, { label: string; palette: Palette }> = {
  'newsroom-classic': {
    label: 'Newsroom Classic',
    palette: { ink: '#14171c', paper: '#efeee8', accent: '#b43d2a', dataAccent: '#3e6b66' },
  },
  'midnight-wire': {
    label: 'Midnight Wire',
    palette: { ink: '#e8e6df', paper: '#101318', accent: '#d24a32', dataAccent: '#5fa89f' },
  },
  'archive-sepia': {
    label: 'Archive Sepia',
    palette: { ink: '#2b2013', paper: '#ece1c9', accent: '#8a4b12', dataAccent: '#4b5d43' },
  },
  'forest-ledger': {
    label: 'Forest Ledger',
    palette: { ink: '#101710', paper: '#eaefe6', accent: '#1f6b3a', dataAccent: '#8a5a24' },
  },
  'high-alert': {
    label: 'High Alert',
    palette: { ink: '#160f0d', paper: '#f4ede9', accent: '#c21807', dataAccent: '#1c3d5a' },
  },
}

export const DEFAULT_DESIGN: DesignConfig = {
  palette: PALETTE_PRESETS['newsroom-classic'].palette,
  simulation: {
    kind: 'plexus',
    density: 90,
    speed: 1,
    intensity: 0.75,
    interactive: true,
  },
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function isHex(v: unknown): v is string {
  return typeof v === 'string' && HEX_RE.test(v.trim())
}

function hexOr(v: unknown, fallback: string): string {
  return isHex(v) ? (v as string).trim() : fallback
}

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const x = typeof n === 'number' && Number.isFinite(n) ? n : fallback
  return Math.min(max, Math.max(min, x))
}

/** Normalize a raw `design-studio` global doc into a safe DesignConfig.
 *  Every field falls back to the default so a half-filled global can't break
 *  the homepage. */
export function resolveDesign(raw: any): DesignConfig {
  const d = DEFAULT_DESIGN
  if (!raw || typeof raw !== 'object') return d

  const presetId: PalettePresetId = raw.palettePreset ?? 'newsroom-classic'
  const base =
    presetId !== 'custom' && PALETTE_PRESETS[presetId as Exclude<PalettePresetId, 'custom'>]
      ? PALETTE_PRESETS[presetId as Exclude<PalettePresetId, 'custom'>].palette
      : d.palette
  const custom = raw.customPalette || {}
  const palette: Palette =
    presetId === 'custom'
      ? {
          ink: hexOr(custom.ink, base.ink),
          paper: hexOr(custom.paper, base.paper),
          accent: hexOr(custom.accent, base.accent),
          dataAccent: hexOr(custom.dataAccent, base.dataAccent),
        }
      : base

  const sim = raw.simulation || {}
  const kind: SimulationKind = ['plexus', 'particles', 'waves', 'constellation', 'off'].includes(sim.kind)
    ? sim.kind
    : d.simulation.kind

  return {
    palette,
    simulation: {
      kind,
      density: clamp(sim.density, 20, 200, d.simulation.density),
      speed: clamp(sim.speed, 0.2, 2, d.simulation.speed),
      intensity: clamp(sim.intensity, 0.1, 1, d.simulation.intensity),
      primary: isHex(sim.primary) ? sim.primary.trim() : undefined,
      secondary: isHex(sim.secondary) ? sim.secondary.trim() : undefined,
      interactive: sim.interactive !== false,
    },
  }
}

/** CSS custom properties for a landing root — retunes the whole page. */
export function designCssVars(design: DesignConfig): Record<string, string> {
  const p = design.palette
  return {
    '--ink': p.ink,
    '--ink-soft': p.ink + 'cc', // 80% alpha of ink for soft text
    '--paper-cool': p.paper,
    '--accent': p.accent,
    '--data-accent': p.dataAccent,
  }
}

/** Colors the simulation should actually draw with. */
export function simColors(design: DesignConfig): { primary: string; secondary: string } {
  return {
    primary: design.simulation.primary ?? design.palette.accent,
    secondary: design.simulation.secondary ?? design.palette.dataAccent,
  }
}
