'use client'

// Layered flowing lines — slow ocean / ink bands drifting across the viewport.
// 3–5 horizontal THREE.Line strips whose y-offsets animate with layered sines
// plus a hand-rolled value noise (no new deps). Alternates primary/secondary.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { SimulationProps } from './types'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

/** Window-level pointer tracking in NDC — the landing canvas itself has
 *  `pointer-events: none`, so R3F's own pointer state never updates. */
function usePointerNdc(enabled: boolean) {
  const pointer = useRef({ x: 0, y: 0, active: false })
  useEffect(() => {
    if (!enabled) {
      pointer.current.active = false
      return
    }
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1
      pointer.current.active = true
    }
    const onLeave = () => {
      pointer.current.active = false
    }
    window.addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])
  return pointer
}

// --- hand-rolled smooth value noise (deterministic, allocation-free) --------
function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  const top = a + (b - a) * u
  const bottom = c + (d - c) * u
  return (top + (bottom - top) * v) * 2 - 1 // → [-1, 1]
}

type WaveLine = {
  line: THREE.Line
  geometry: THREE.BufferGeometry
  material: THREE.LineBasicMaterial
  baseY: number
  seed: number
  phaseVel: number
  amp: number
  isPrimary: boolean
}

function WaveScene({ density, speed, intensity, primary, secondary, interactive }: SimulationProps) {
  const { viewport } = useThree()
  const pointer = usePointerNdc(interactive)

  // density → band count (3–5) and points per line (64–160).
  const t = (Math.min(200, Math.max(20, density)) - 20) / 180
  const lineCount = 3 + Math.round(t * 2)
  const pointsPerLine = 64 + Math.round(t * 96)
  const halfW = viewport.width / 2 + 0.6 // bleed past the edges

  const lines = useMemo<WaveLine[]>(() => {
    const arr: WaveLine[] = []
    for (let i = 0; i < lineCount; i++) {
      const positions = new Float32Array(pointsPerLine * 3)
      const baseY = lineCount === 1 ? 0 : -2.5 + (i / (lineCount - 1)) * 5
      for (let j = 0; j < pointsPerLine; j++) {
        positions[j * 3] = -halfW + (j / (pointsPerLine - 1)) * halfW * 2
        positions[j * 3 + 1] = baseY
        positions[j * 3 + 2] = -0.6 + i * 0.25 // slight depth stagger
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const isPrimary = i % 2 === 0
      const material = new THREE.LineBasicMaterial({
        color: isPrimary ? primary : secondary,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
      arr.push({
        line: new THREE.Line(geometry, material),
        geometry,
        material,
        baseY,
        seed: i * 37.7 + 11.3,
        phaseVel: 0.75 + (i % 3) * 0.2, // bands slide at slightly different rates
        amp: 0.85 + (i % 2) * 0.3,
        isPrimary,
      })
    }
    return arr
  }, [lineCount, pointsPerLine, halfW, primary, secondary])

  // Dispose GPU resources when the config changes or the sim unmounts.
  useEffect(
    () => () => {
      lines.forEach(({ geometry, material }) => {
        geometry.dispose()
        material.dispose()
      })
    },
    [lines],
  )

  useFrame((state) => {
    const time = state.clock.elapsedTime * speed * 0.45
    const bow = interactive && pointer.current.active
    const px = (pointer.current.x * state.viewport.width) / 2
    const py = (pointer.current.y * state.viewport.height) / 2

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      const posAttr = l.geometry.attributes.position as THREE.BufferAttribute
      const pos = posAttr.array as Float32Array
      const phase = time * l.phaseVel + l.seed

      for (let j = 0; j < pointsPerLine; j++) {
        const j3 = j * 3
        const x = pos[j3]
        let y =
          l.baseY +
          l.amp *
            (Math.sin(x * 0.55 + phase) * 0.3 +
              Math.sin(x * 1.15 - phase * 1.35 + l.seed) * 0.14 +
              valueNoise(x * 0.4 + l.seed, time * 0.5) * 0.28)

        if (bow) {
          // Bow gently away from the pointer — gaussian falloff, capped push.
          const dx = x - px
          const dy = y - py
          const fall = Math.exp(-(dx * dx + dy * dy) / 1.6)
          y += (dy >= 0 ? 1 : -1) * fall * 0.45
        }
        pos[j3 + 1] = y
      }
      posAttr.needsUpdate = true
      // Cheap per-frame assignment keeps intensity live without geometry rebuilds.
      l.material.opacity = Math.min(1, intensity * (l.isPrimary ? 0.75 : 0.55))
    }
  })

  return (
    <group>
      {lines.map((l, i) => (
        <primitive key={i} object={l.line} />
      ))}
    </group>
  )
}

export default function WaveField(props: SimulationProps) {
  const reducedMotion = usePrefersReducedMotion()

  if (reducedMotion) {
    // Static fallback — same visual weight, zero animation cost.
    return (
      <div
        className={props.className}
        style={{
          background: `linear-gradient(180deg, transparent 30%, ${props.secondary}18 55%, ${props.primary}14 75%, transparent 95%)`,
        }}
        aria-hidden
      />
    )
  }

  return (
    <Canvas className={props.className} camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 1.5]} aria-hidden>
      <WaveScene {...props} />
    </Canvas>
  )
}
