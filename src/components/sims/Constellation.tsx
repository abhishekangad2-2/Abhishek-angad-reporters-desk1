'use client'

// Sparse starfield — small twinkling points with faint links to their nearest
// few neighbors. K-nearest pairs are precomputed ONCE at mount (stars don't
// drift), so the per-frame cost is a single O(n + links) color pass; no O(n²)
// work ever happens inside useFrame.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SimulationProps } from './types'

const BOUNDS_X = 6.5
const BOUNDS_Y = 3.8
const BOUNDS_Z = 1.5
const NEIGHBORS = 3
const HOVER_RADIUS_SQ = 1.8 * 1.8

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

function ConstellationScene({ density, speed, intensity, primary, secondary, interactive }: SimulationProps) {
  // density 20–200 → 30–140 stars: deliberately sparser than plexus.
  const count = useMemo(() => {
    const t = (Math.min(200, Math.max(20, density)) - 20) / 180
    return Math.round(30 + t * 110)
  }, [density])

  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const groupRef = useRef<THREE.Group>(null)
  const pointer = usePointerNdc(interactive)

  const data = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const starColors = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const rates = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2 * BOUNDS_X
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2 * BOUNDS_Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2 * BOUNDS_Z
      phases[i] = Math.random() * Math.PI * 2 // staggered twinkle
      rates[i] = 0.5 + Math.random() // per-star twinkle rate
    }

    // K-nearest neighbors, computed once at mount (O(n²) here, never per frame).
    const pairKeys = new Set<number>()
    const pairs: number[] = []
    const dists = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < count; j++) {
        const dx = positions[i * 3] - positions[j * 3]
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1]
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2]
        dists[j] = j === i ? Infinity : dx * dx + dy * dy + dz * dz
      }
      for (let n = 0; n < NEIGHBORS; n++) {
        let best = -1
        let bestD = Infinity
        for (let j = 0; j < count; j++) {
          if (dists[j] < bestD) {
            bestD = dists[j]
            best = j
          }
        }
        if (best < 0) break
        dists[best] = Infinity
        const a = Math.min(i, best)
        const b = Math.max(i, best)
        const key = a * count + b
        if (!pairKeys.has(key)) {
          pairKeys.add(key)
          pairs.push(a, b)
        }
      }
    }

    const linkCount = pairs.length / 2
    const linePositions = new Float32Array(linkCount * 6)
    const lineColors = new Float32Array(linkCount * 6)
    for (let l = 0; l < linkCount; l++) {
      const a = pairs[l * 2]
      const b = pairs[l * 2 + 1]
      linePositions.set(positions.subarray(a * 3, a * 3 + 3), l * 6)
      linePositions.set(positions.subarray(b * 3, b * 3 + 3), l * 6 + 3)
    }

    return {
      positions,
      starColors,
      phases,
      rates,
      pairs: new Uint16Array(pairs),
      linkCount,
      linePositions,
      lineColors,
      // Scratch buffer for per-star brightness so the link pass reuses it.
      brightness: new Float32Array(count),
    }
  }, [count])

  const palette = useMemo(() => {
    const p = new THREE.Color(primary)
    const s = new THREE.Color(secondary)
    return { pr: p.r, pg: p.g, pb: p.b, sr: s.r, sg: s.g, sb: s.b }
  }, [primary, secondary])

  useFrame((state) => {
    const pts = pointsRef.current
    const lines = linesRef.current
    if (!pts || !lines) return
    const starColorAttr = pts.geometry.attributes.color as THREE.BufferAttribute | undefined
    const lineColorAttr = lines.geometry.attributes.color as THREE.BufferAttribute | undefined
    if (!starColorAttr || !lineColorAttr) return

    const time = state.clock.elapsedTime * speed
    const { positions, starColors, phases, rates, pairs, linkCount, lineColors, brightness } = data
    const hover = interactive && pointer.current.active
    const px = (pointer.current.x * state.viewport.width) / 2
    const py = (pointer.current.y * state.viewport.height) / 2

    // Pass 1 — stars: staggered twinkle + proximity glow, written as vertex
    // color brightness (reads as opacity against the dark landing field).
    for (let i = 0; i < count; i++) {
      let b = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(time * rates[i] + phases[i]))
      let boost = 0
      if (hover) {
        const dx = positions[i * 3] - px
        const dy = positions[i * 3 + 1] - py
        const dSq = dx * dx + dy * dy
        if (dSq < HOVER_RADIUS_SQ) boost = 1 - dSq / HOVER_RADIUS_SQ
      }
      brightness[i] = boost
      b = Math.min(1, b + boost * 0.9)
      starColors[i * 3] = palette.pr * b
      starColors[i * 3 + 1] = palette.pg * b
      starColors[i * 3 + 2] = palette.pb * b
    }

    // Pass 2 — links: faint at rest; fade in when either endpoint is near the
    // pointer. O(links) only, using the brightness scratch from pass 1.
    for (let l = 0; l < linkCount; l++) {
      const boost = Math.max(brightness[pairs[l * 2]], brightness[pairs[l * 2 + 1]])
      const lb = 0.3 + boost * 0.7
      const l6 = l * 6
      lineColors[l6] = lineColors[l6 + 3] = palette.sr * lb
      lineColors[l6 + 1] = lineColors[l6 + 4] = palette.sg * lb
      lineColors[l6 + 2] = lineColors[l6 + 5] = palette.sb * lb
    }

    starColorAttr.needsUpdate = true
    lineColorAttr.needsUpdate = true

    // Barely-there sway so the sky feels alive without moving the stars
    // (link geometry stays valid because the whole group moves together).
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(time * 0.05) * 0.015
    }
  })

  return (
    // Key forces a clean geometry rebuild when the editor changes the count.
    <group ref={groupRef} key={count}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.starColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          transparent
          opacity={Math.min(1, 0.35 + intensity * 0.65)}
          size={0.07}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={intensity * 0.45} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

export default function Constellation(props: SimulationProps) {
  const reducedMotion = usePrefersReducedMotion()

  if (reducedMotion) {
    // Static fallback — same visual weight, zero animation cost.
    return (
      <div
        className={props.className}
        style={{
          background: `radial-gradient(circle at 70% 25%, ${props.primary}1e, transparent 55%)`,
        }}
        aria-hidden
      />
    )
  }

  return (
    <Canvas className={props.className} camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 1.5]} aria-hidden>
      <ConstellationScene {...props} />
    </Canvas>
  )
}
