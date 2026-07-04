'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Masthead from './Masthead'
import SimulationBackground from './sims/SimulationBackground'
import { buildCards, type LandingData } from '@/lib/landing'
import { designCssVars, DEFAULT_DESIGN } from '@/lib/design'

/** Modern broadsheet — double-rule dateline, a large lead story (hero image +
 *  kicker + big serif headline + standfirst + byline), a right rail of two
 *  secondary stories with thumbnails, and a row of short briefs. The hero
 *  parallaxes gently on scroll, and hovering any headline materialises a small,
 *  transient plexus "cloud" around it. */
export default function NewspaperLanding({ data }: { data: LandingData }) {
  const cards = buildCards(data, 3).slice(0, 3)
  const lead = cards[0]
  const secondary = cards.slice(1, 3)
  const briefs = cards.slice(3, 7)

  const leadImgRef = useRef<HTMLImageElement>(null)
  const linksRef = useRef<HTMLCanvasElement>(null)

  // Compute the dateline only after mount — rendering new Date() during SSR
  // and again on the client produces different text and breaks hydration.
  const [dateline, setDateline] = useState('')
  useEffect(() => {
    try {
      setDateline(
        new Date().toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      )
    } catch {
      /* leave empty */
    }
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    // Gentle hero parallax.
    const onScroll = () => {
      const img = leadImgRef.current
      if (img) {
        const y = Math.min(80, window.scrollY * 0.08)
        img.style.transform = `translateY(${y}px)`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Transient plexus cloud around a hovered headline.
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

    type Cloud = { cx: number; cy: number; pts: { x: number; y: number }[]; life: number }
    let cloud: Cloud | null = null
    let phase = 0
    let raf = 0

    const draw = () => {
      lctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      if (cloud) {
        phase += 0.05
        cloud.life -= 0.012
        const al = Math.max(0, cloud.life)
        cloud.pts.forEach((p, i) => {
          lctx.strokeStyle = '#6fb3a9'
          lctx.globalAlpha = al * 0.5
          lctx.lineWidth = 0.7
          lctx.beginPath()
          lctx.moveTo(cloud!.cx, cloud!.cy)
          lctx.lineTo(p.x, p.y)
          lctx.stroke()
          lctx.fillStyle = '#b43d2a'
          lctx.globalAlpha = al * 0.8
          lctx.beginPath()
          lctx.arc(p.x, p.y, 1.6 + Math.sin(phase + i), 0, 6.28)
          lctx.fill()
        })
        lctx.globalAlpha = 1
        if (cloud.life <= 0) cloud = null
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const heads = Array.from(document.querySelectorAll<HTMLElement>('[data-headline]'))
    const enter = (h: HTMLElement) => () => {
      const r = h.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const pts = []
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * 6.28
        const rr = 30 + Math.random() * 70
        pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr })
      }
      cloud = { cx, cy, pts, life: 1 }
      h.classList.add('np-headline-hot')
    }
    const leave = (h: HTMLElement) => () => h.classList.remove('np-headline-hot')
    const cleaners: Array<() => void> = []
    heads.forEach((h) => {
      const e = enter(h)
      const l = leave(h)
      h.addEventListener('mouseenter', e)
      h.addEventListener('mouseleave', l)
      cleaners.push(() => {
        h.removeEventListener('mouseenter', e)
        h.removeEventListener('mouseleave', l)
      })
    })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
      cleaners.forEach((fn) => fn())
    }
  }, [])

  return (
    <div
      className="landing landing--newspaper"
      style={designCssVars(data.design ?? DEFAULT_DESIGN) as CSSProperties}
    >
      <canvas ref={linksRef} className="np-links" aria-hidden />
      <div className="newspaper-masthead-band">
        <SimulationBackground
          design={data.design}
          className="landing-canvas landing-canvas--thin"
          densityScale={0.31}
          intensityScale={0.22}
          overrides={{
            primary: (data.design ?? DEFAULT_DESIGN).palette.ink,
            secondary: (data.design ?? DEFAULT_DESIGN).palette.accent,
          }}
        />
        <Masthead sections={data.sections} labels={data.labels} />
      </div>

      {lead ? (
        <main className="np-stage">
          <div className="np-dateline">
            <span>{dateline}</span>
            <span>Independent ground reportage</span>
            <span>Ranchi · Jharkhand</span>
          </div>

          <div className="np-grid">
            <article className="np-lead">
              {lead.heroUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img ref={leadImgRef} className="np-lead-img" src={lead.heroUrl} alt="" />
              )}
              {lead.heroUrl && (
                <div className="np-lead-figcap">Photograph · Abhishek Angad / ReportersDesk</div>
              )}
              <span className="np-kicker">{lead.kicker}</span>
              <a href={lead.href} className="np-lead-link">
                <h1 data-headline>{lead.headline}</h1>
              </a>
              {lead.strap && <p className="np-standfirst">{lead.strap}</p>}
              <div className="np-byline">By Abhishek Angad · 12 min read</div>
            </article>

            <div className="np-rule-v" />

            <aside className="np-aside">
              {secondary.map((c, i) => (
                <a key={i} href={c.href} className="np-sec">
                  {c.heroUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.heroUrl} alt="" />
                  )}
                  <span className="np-kicker">{c.kicker}</span>
                  <h3 data-headline>{c.headline}</h3>
                  {c.strap && <p>{c.strap}</p>}
                </a>
              ))}
            </aside>
          </div>

          {briefs.length > 0 && (
            <div className="np-briefs">
              {briefs.map((c, i) => (
                <a key={i} href={c.href} className="np-brief">
                  <span className="np-kicker">{c.kicker}</span>
                  <h4 data-headline>{c.headline}</h4>
                </a>
              ))}
            </div>
          )}
        </main>
      ) : (
        <p className="landing-empty">No published stories yet.</p>
      )}
    </div>
  )
}
