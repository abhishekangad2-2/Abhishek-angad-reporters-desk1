'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import Masthead from './Masthead'
import LazyPlexus from './LazyPlexus'
import { buildCards, type LandingData } from '@/lib/landing'
import { designCssVars, DEFAULT_DESIGN } from '@/lib/design'

/** X/Y — the Z-pattern layout, now a CSS-3D + plexus hybrid. Three stories are
 *  staged in a perspective scene as alternating picture↔text rows (pic-text →
 *  text-pic → pic-text). As the reader scrolls, each row dollies through depth:
 *  it rises from far away (translateZ negative, dimmed, tilted) to fill the
 *  frame at centre, then recedes again — a camera-dolly feel achieved with CSS
 *  3D transforms rather than WebGL, so it needs no cross-origin textures (the
 *  reason a true WebGL dolly was deferred; see the design-decision memory). A
 *  live plexus network sits fixed behind everything. Reduced-motion users get
 *  the flat, static zig-zag. */
export default function ZPatternLanding({ data }: { data: LandingData }) {
  const cards = buildCards(data, 3).slice(0, 3)
  const design = data.design ?? DEFAULT_DESIGN
  const stageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stage = stageRef.current
    if (reduce || !stage) return

    const rows = Array.from(stage.querySelectorAll<HTMLElement>('.zig-row'))
    let raf = 0

    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const mid = vh / 2
      for (const row of rows) {
        const r = row.getBoundingClientRect()
        const center = r.top + r.height / 2
        // p: 0 when the row is centred, ±1 when it is a viewport away.
        const p = Math.max(-1.35, Math.min(1.35, (center - mid) / vh))
        const ap = Math.abs(p)
        row.style.setProperty('--z', `${(-ap * 520).toFixed(1)}px`) // recede off-centre
        row.style.setProperty('--rx', `${(p * 6.5).toFixed(2)}deg`) // tilt like a passing plane
        row.style.setProperty('--op', `${Math.max(0.16, 1 - ap * 0.95).toFixed(3)}`)
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [cards.length])

  return (
    <div className="landing landing--z-pattern" style={designCssVars(design) as CSSProperties}>
      <LazyPlexus
        className="landing-canvas landing-canvas--fixed zig-plexus"
        color={design.palette.accent}
        lineColor={design.palette.ink}
        intensity={0.42}
        nodeCount={68}
        connectDistance={2.7}
      />
      <Masthead sections={data.sections} labels={data.labels} />

      {cards.length > 0 ? (
        <main className="zig-stage" ref={stageRef}>
          <div className="zig-scene">
            {cards.map((c, i) => (
              <a
                key={i}
                href={c.href}
                className={`zig-row ${i % 2 === 1 ? 'zig-row--flip' : ''}`}
              >
                <div className="zig-media">
                  {c.heroUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="zig-img" src={c.heroUrl} alt="" loading="lazy" />
                  ) : (
                    <span className="zig-img zig-img--blank" />
                  )}
                  <span className="zig-depth-tag" aria-hidden>
                    0{i + 1} / 03
                  </span>
                </div>
                <div className="zig-text">
                  <span className="zig-index">0{i + 1}</span>
                  <span className="zig-kicker">{c.kicker}</span>
                  <h2 className="zig-headline">{c.headline}</h2>
                  {c.strap && <p className="zig-strap">{c.strap}</p>}
                  <span className="zig-cta">Read the story →</span>
                </div>
              </a>
            ))}
          </div>
        </main>
      ) : (
        <p className="landing-empty">No published stories yet.</p>
      )}
    </div>
  )
}
