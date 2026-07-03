'use client'

// Drifting dust / ember field. Slow brownian wander with a gentle upward bias —
// restrained newsroom atmosphere, not confetti. Rendered as a single
// THREE.Points cloud with vertex colors mixing primary/secondary.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SimulationProps } from './types'

const BOUNDS_X = 7
const BOUNDS_Y = 4.2
const BOUNDS_Z = 2
const REPEL_RADIUS = 1.6
const REPEL_RADIUS_SQ = REPEL_RADIUS * REPEL_RADIUS

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

function ParticleScene({ density, speed, intensity, primary, secondary, interactive }: SimulationProps) {
  // density 20–200 → roughly 200–2600 points.
  const count = useMemo(() => {
    const t = (Math.min(200, Math.max(20, density)) - 20) / 180
    return Math.round(200 + t * 2400)
  }, [density])

  const pointsRef = useRef<THREE.Points>(null)
  const pointer = usePointerNdc(interactive)

  const { positions, colors, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    // Velocities in world-units/second, mutated in place every frame.
    const velocities = new Float32Array(count * 3)
    const cPrimary = new THREE.Color(primary)
    const cSecondary = new THREE.Color(secondary)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 2 * BOUNDS_X
      positions[i3 + 1] = (Math.random() - 0.5) * 2 * BOUNDS_Y
      positions[i3 + 2] = (Math.random() - 0.5) * 2 * BOUNDS_Z
      velocities[i3] = (Math.random() - 0.5) * 0.1
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.1
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02
      // Mostly primary embers with secondary dust mixed in; slight brightness
      // variation so the field doesn't read as a flat texture.
      const c = Math.random() < 0.65 ? cPrimary : cSecondary
      const v = 0.7 + Math.random() * 0.3
      colors[i3] = c.r * v
      colors[i3 + 1] = c.g * v
      colors[i3 + 2] = c.b * v
    }
    return { positions, colors, velocities }
  }, [count, primary, secondary])

  useFrame((state, delta) => {
    const pts = pointsRef.current
    if (!pts) return
    const posAttr = pts.geometry.attributes.position as THREE.BufferAttribute | undefined
    if (!posAttr) return
    const pos = posAttr.array as Float32Array

    const dt = Math.min(delta, 0.05) * speed
    const repel = interactive && pointer.current.active
    const px = (pointer.current.x * state.viewport.width) / 2
    const py = (pointer.current.y * state.viewport.height) / 2

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // Brownian wander: random nudge, damped so drift stays slow and smooth.
      velocities[i3] += (Math.random() - 0.5) * 0.9 * dt
      velocities[i3 + 1] += (Math.random() - 0.5) * 0.9 * dt
      velocities[i3] *= 0.985
      velocities[i3 + 1] *= 0.985

      if (repel) {
        const dx = pos[i3] - px
        const dy = pos[i3 + 1] - py
        const dSq = dx * dx + dy * dy
        if (dSq < REPEL_RADIUS_SQ && dSq > 0.0001) {
          const d = Math.sqrt(dSq)
          const force = ((1 - d / REPEL_RADIUS) * 1.4 * dt) / d
          velocities[i3] += dx * force
          velocities[i3 + 1] += dy * force
        }
      }

      // Gentle upward bias — embers rising off a page.
      pos[i3] += velocities[i3] * dt
      pos[i3 + 1] += (velocities[i3 + 1] + 0.07) * dt
      pos[i3 + 2] += velocities[i3 + 2] * dt

      // Wrap around the stage instead of bouncing — reads as endless drift.
      if (pos[i3 + 1] > BOUNDS_Y) pos[i3 + 1] = -BOUNDS_Y
      else if (pos[i3 + 1] < -BOUNDS_Y) pos[i3 + 1] = BOUNDS_Y
      if (pos[i3] > BOUNDS_X) pos[i3] = -BOUNDS_X
      else if (pos[i3] < -BOUNDS_X) pos[i3] = BOUNDS_X
      if (pos[i3 + 2] > BOUNDS_Z) pos[i3 + 2] = -BOUNDS_Z
      else if (pos[i3 + 2] < -BOUNDS_Z) pos[i3 + 2] = BOUNDS_Z
    }
    posAttr.needsUpdate = true
  })

  return (
    // Key forces a clean geometry rebuild when the editor changes count/colors.
    <points ref={pointsRef} key={`${count}-${primary}-${secondary}`}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        transparent
        opacity={Math.min(1, 0.25 + intensity * 0.75)}
        size={0.035 + intensity * 0.045}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function ParticleField(props: SimulationProps) {
  const reducedMotion = usePrefersReducedMotion()

  if (reducedMotion) {
    // Static fallback — same visual weight, zero animation cost.
    return (
      <div
        className={props.className}
        style={{
          background: `radial-gradient(circle at 30% 20%, ${props.primary}22, transparent 60%)`,
        }}
        aria-hidden
      />
    )
  }

  return (
    <Canvas className={props.className} camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 1.5]} aria-hidden>
      <ParticleScene {...props} />
    </Canvas>
  )
}
