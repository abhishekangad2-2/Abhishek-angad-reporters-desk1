// Common contract every landing background simulation implements.
// SimulationBackground (the switcher) maps the editor's Design Studio config
// onto these props; individual sims decide how to interpret them.

export type SimulationProps = {
  className?: string
  /** Node / particle count driver (already clamped 20–200). */
  density: number
  /** Animation speed multiplier (0.2–2). */
  speed: number
  /** Visual strength 0–1 (opacity / brightness). */
  intensity: number
  /** Primary draw color (nodes / particles / crests). */
  primary: string
  /** Secondary draw color (lines / trails / troughs). */
  secondary: string
  /** Whether the sim should react to pointer / focused card. */
  interactive: boolean
  /** Index of the hovered landing card, when a layout provides one. */
  focusIndex?: number | null
}
