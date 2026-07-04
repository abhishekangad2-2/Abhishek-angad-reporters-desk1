'use client'

import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import Masthead from './Masthead'
import SimulationBackground from './sims/SimulationBackground'
import { buildCards, type LandingCard, type LandingData } from '@/lib/landing'
import { designCssVars, DEFAULT_DESIGN } from '@/lib/design'

/** X/Y rows — three horizontal, sideways-scrolling rows of story cards. The
 *  card nearest each row's centre "blooms" (scales up, brightens) while the
 *  others dim. Arrow buttons step the carousel; hovering a card draws plexus
 *  connection lines to cards sharing its kicker — teal within the row, gold
 *  across rows — over the shared faint Plexus background. */

type Row = { title: string; sub: string; cards: LandingCard[] }

export default function ZPatternLanding({ data }: { data: LandingData }) {
  const cards = buildCards(data, 3).slice(0, 3)

  // Split the cards into three themed rows.
  const rows = useMemo<Row[]>(() => {
    const per = Math.max(1, Math.ceil(cards.length / 3))
    const labels: { title: string; sub: string }[] = [
      { title: 'Ground Reportage', sub: 'From the field' },
      { title: 'Visual & Audio', sub: 'In frames & on tape' },
      { title: 'Investigations & Policy', sub: 'Follow the money & the rolls' },
    ]
    return labels.map((l, i) => ({
      ...l,
      cards: cards.slice(i * per, i * per + per),
    }))
  }, [cards])

  const stageRef = useRef<HTMLElement>(null)
  const linksRef = useRef<HTMLCanvasElement>(null)
  const trackRefs = useRef<(HTMLDivElement | null)[]>([])
  const hoveredRef = useRef<HTMLElement | null>(null)

  // Bloom: nearest card to each row's centre pops forward, others dim.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const bloom = (track: HTMLDivElement) => {
      const rect = track.getBoundingClientRect()
      const mid = rect.left + rect.width / 2
      const cards = Array.from(track.querySelectorAll<HTMLElement>('.xy-card'))
      let best: HTMLElement | null = null
      let bestD = Infinity
      cards.forEach((c) => {
        const r = c.getBoundingClientRect()
        const d = Math.abs(r.left + r.width / 2 - mid)
        if (d < bestD) {
          bestD = d
          best = c
        }
      })
      cards.forEach((c) => {
        c.classList.toggle('bloom', c === best)
        c.classList.toggle('dim', c !== best && bestD < rect.width)
      })
    }

    const bloomAll = () => trackRefs.current.forEach((t) => t && bloom(t))

    const trackHandlers: Array<() => void> = []
    trackRefs.current.forEach((t) => {
      if (!t) return
      const h = () => requestAnimationFrame(() => bloom(t))
      t.addEventListener('scroll', h, { passive: true })
      trackHandlers.push(() => t.removeEventListener('scroll', h))
    })
    const onScroll = () => requestAnimationFrame(bloomAll)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', bloomAll)
    bloomAll()

    if (reduce) {
      // No animated link canvas under reduced motion.
      return () => {
        trackHandlers.forEach((fn) => fn())
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', bloomAll)
      }
    }

    // Hover plexus link canvas: teal within row, gold across rows.
    const lc = linksRef.current!
    const lctx = lc.getContext('2d')!
    const resize = () => {
      const d = Math.min(window.devicePixelRatio || 1, 2)
      lc.width = (window.innerWidth * d) | 0
      lc.height = (window.innerHeight * d) | 0
      lctx.setTransform(d, 0, 0, d, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const allCards = Array.from(document.querySelectorAll<HTMLElement>('.xy-card'))
    const center = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }

    let phase = 0
    let raf = 0
    const draw = () => {
      lctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const hovered = hoveredRef.current
      if (hovered) {
        phase += 0.05
        const a = center(hovered)
        const tag = hovered.dataset.tag
        const row = hovered.dataset.row
        allCards.forEach((c) => {
          if (c === hovered || c.dataset.tag !== tag) return
          const cross = c.dataset.row !== row
          const b = center(c)
          const glow = 0.4 + 0.25 * Math.sin(phase)
          lctx.strokeStyle = cross ? '#d9a441' : '#6fb3a9'
          lctx.globalAlpha = glow
          lctx.lineWidth = cross ? 1.4 : 1
          lctx.beginPath()
          lctx.moveTo(a.x, a.y)
          lctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - (cross ? 70 : 30), b.x, b.y)
          lctx.stroke()
          lctx.fillStyle = cross ? '#d9a441' : '#6fb3a9'
          lctx.beginPath()
          lctx.arc(b.x, b.y, 3, 0, 6.2832)
          lctx.fill()
        })
        lctx.globalAlpha = 1
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const enter = (c: HTMLElement) => () => {
      hoveredRef.current = c
      const tag = c.dataset.tag
      const row = c.dataset.row
      allCards.forEach((o) => {
        if (o !== c && o.dataset.tag === tag) {
          o.classList.add(o.dataset.row === row ? 'is-related' : 'is-related-cross')
        }
      })
    }
    const leave = () => {
      hoveredRef.current = null
      allCards.forEach((o) => o.classList.remove('is-related', 'is-related-cross'))
    }
    const cleaners: Array<() => void> = []
    allCards.forEach((c) => {
      const e = enter(c)
      c.addEventListener('mouseenter', e)
      c.addEventListener('mouseleave', leave)
      cleaners.push(() => {
        c.removeEventListener('mouseenter', e)
        c.removeEventListener('mouseleave', leave)
      })
    })

    return () => {
      cancelAnimationFrame(raf)
      trackHandlers.forEach((fn) => fn())
      cleaners.forEach((fn) => fn())
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', bloomAll)
      window.removeEventListener('resize', resize)
    }
  }, [rows])

  const step = (i: number, dir: 'prev' | 'next') => {
    const track = trackRefs.current[i]
    if (!track) return
    const card = track.querySelector<HTMLElement>('.xy-card')
    const w = (card?.getBoundingClientRect().width || 300) + 22
    track.scrollBy({ left: dir === 'next' ? w : -w, behavior: 'smooth' })
  }

  return (
    <div
      className="landing landing--z-pattern"
      style={designCssVars(data.design ?? DEFAULT_DESIGN) as CSSProperties}
    >
      <SimulationBackground
        design={data.design}
        className="landing-canvas landing-canvas--fixed"
        densityScale={0.78}
        intensityScale={0.4}
      />
      <canvas ref={linksRef} className="xy-links" aria-hidden />
      <Masthead sections={data.sections} labels={data.labels} />

      <main className="xy-stage" ref={stageRef}>
        <div className="xy-intro">
          Three rows · scroll a row sideways — the centre story blooms forward · hover for cross-row
          links
        </div>

        {rows.map((row, ri) => (
          <section className="xy-row" key={ri}>
            <div className="xy-row-label">
              <h2>{row.title}</h2>
              <span>{row.sub}</span>
              <div className="xy-nav">
                <button
                  className="xy-arrow"
                  aria-label="Scroll left"
                  onClick={() => step(ri, 'prev')}
                >
                  ‹
                </button>
                <button
                  className="xy-arrow"
                  aria-label="Scroll right"
                  onClick={() => step(ri, 'next')}
                >
                  ›
                </button>
              </div>
            </div>
            <div
              className="xy-track"
              ref={(el) => {
                trackRefs.current[ri] = el
              }}
            >
              {row.cards.map((c, ci) => (
                <a
                  key={ci}
                  className="xy-card"
                  data-row={ri + 1}
                  data-tag={c.kicker}
                  href={c.href}
                >
                  {c.heroUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="xy-card-img" src={c.heroUrl} alt="" />
                  ) : (
                    <span className="xy-card-img xy-card-img--blank" />
                  )}
                  <span className="xy-card-scrim" />
                  <div className="xy-card-body">
                    <span className="xy-card-kicker">{c.kicker}</span>
                    <div className="xy-card-headline">{c.headline}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
