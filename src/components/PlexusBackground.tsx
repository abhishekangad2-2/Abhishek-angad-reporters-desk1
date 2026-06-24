'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type PlexusBackgroundProps = {
  nodeCount?: number
  connectDistance?: number
  color?: string
  lineColor?: string
  /** 0–1. The immersive template ties this to scroll progress so the
   *  network visibly grows denser/brighter as the investigation deepens. */
  intensity?: number
  /** Index of a node to bias connections toward — the three-column template
   *  passes the hovered column index here so the network visibly "leans in". */
  focusIndex?: number | null
  className?: string
}

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

function PlexusScene({
  nodeCount = 80,
  connectDistance = 2.6,
  color = '#b43d2a',
  lineColor = '#3e6b66',
  intensity = 0.5,
  focusIndex = null,
}: PlexusBackgroundProps) {
  const points = useMemo(() => {
    const arr: THREE.Vector3[] = []
    for (let i = 0; i < nodeCount; i++) {
      arr.push(
        new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 7, (Math.random() - 0.5) * 4),
      )
    }
    return arr
  }, [nodeCount])

  const velocities = useMemo(
    () => points.map(() => new THREE.Vector3((Math.random() - 0.5) * 0.004, (Math.random() - 0.5) * 0.004, 0)),
    [points],
  )

  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)

  useFrame(() => {
    points.forEach((p, i) => {
      p.add(velocities[i])
      if (Math.abs(p.x) > 6) velocities[i].x *= -1
      if (Math.abs(p.y) > 3.5) velocities[i].y *= -1
    })

    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
      points.forEach((p, i) => posAttr.setXYZ(i, p.x, p.y, p.z))
      posAttr.needsUpdate = true
    }

    if (linesRef.current) {
      const linePositions: number[] = []
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dist = points[i].distanceTo(points[j])
          const biased = focusIndex !== null && (i === focusIndex || j === focusIndex)
          if (dist < connectDistance * (biased ? 1.6 : 1)) {
            linePositions.push(points[i].x, points[i].y, points[i].z, points[j].x, points[j].y, points[j].z)
          }
        }
      }
      linesRef.current.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    }
  })

  const initialPositions = useMemo(
    () => new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])),
    [points],
  )

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={points.length} array={initialPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.06} transparent opacity={intensity} sizeAttenuation />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial color={lineColor} transparent opacity={intensity * 0.4} />
      </lineSegments>
    </>
  )
}

export default function PlexusBackground(props: PlexusBackgroundProps) {
  const reducedMotion = usePrefersReducedMotion()

  if (reducedMotion) {
    // Static fallback — a soft gradient instead of a live particle scene.
    // Same visual "weight" in the layout, zero animation cost.
    return (
      <div
        className={props.className}
        style={{
          background: `radial-gradient(circle at 30% 20%, ${props.color ?? '#b43d2a'}22, transparent 60%)`,
        }}
        aria-hidden
      />
    )
  }

  return (
    <Canvas className={props.className} camera={{ position: [0, 0, 8], fov: 50 }} dpr={[1, 1.5]} aria-hidden>
      <PlexusScene {...props} />
    </Canvas>
  )
}
