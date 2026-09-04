'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import Masthead from './Masthead'
import SimulationBackground from './sims/SimulationBackground'
import { buildCards, type LandingData } from '@/lib/landing'
import { designCssVars, DEFAULT_DESIGN } from '@/lib/design'
import type { Episode } from '@/lib/podcasts'

/** Single full-bleed feature — a hero title over an evolving dark background,
 *  scroll-revealed text blocks and large figures (IntersectionObserver fade-in),
 *  a pull-quote, an audio block (play button + simulated visualiser), a
 *  reading-progress bar, and a small "connections" graph in the corner that
 *  grows a node each time a figure scrolls into view. The shared Plexus canvas
 *  brightens and shifts hue as the reader descends. */

const THEMES = [
  'radial-gradient(120% 120% at 50% 0%, #14202a 0%, #0c0e11 60%)',
  'radial-gradient(120% 120% at 50% 30%, #2a2017 0%, #0c0e11 62%)',
  'radial-gradient(120% 120% at 50% 60%, #241319 0%, #07080a 60%)',
]
const LINE_COLORS = ['#3e6b66', '#9c7b3e', '#7a3f3f']

// The hero CTA should name what the reader is actually opening — a book review
// is not an "investigation". Derive the label from the story's section slug
// (the first path segment of its href, which is locale-independent), and fall
// back to a neutral "Read the story" for anything not explicitly mapped.
const INVESTIGATION_SECTIONS = new Set([
  'investigative-journalism',
  'accountability-journalism',
  'data-journalism',
])
function storyCtaLabel(href: string): string {
  const slug = href.split(/[?#]/)[0].split('/').filter(Boolean)[0] ?? ''
  if (slug === 'book-reviews') return 'Read the book review →'
  if (INVESTIGATION_SECTIONS.has(slug)) return 'Read the investigation →'
  return 'Read the story →'
}

export default function ImmersiveLanding({
  data,
  latestEpisode = null,
}: {
  data: LandingData
  latestEpisode?: Episode | null
}) {
  const cards = buildCards(data, 3).slice(0, 3)
  const hero = cards[0]
  const body = cards.slice(1)

  // Interleave prose blocks and figures from the available cards.
  const blocks = body.map((c, i) => ({ ...c, isFigure: i % 2 === 1 }))

  const containerRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const progRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<HTMLCanvasElement>(null)
  const graphLabelRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLCanvasElement>(null)
  const lineColorRef = useRef('#3e6b66')

  const [intensity, setIntensity] = useState(0.25)

  // Reveal-on-scroll, evolving background, progress bar, growing graph.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = containerRef.current
    if (!root) return

    const revealEls = root.querySelectorAll<HTMLElement>(
      '.im-block,.im-figure,.im-quote,.im-pod',
    )
    if (reduce) {
      revealEls.forEach((el) => el.classList.add('in'))
    } else {
      const io = new IntersectionObserver(
        (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
        { threshold: 0.25 },
      )
      revealEls.forEach((el) => io.observe(el))

      // Corner connections graph.
      const graph = graphRef.current!
      const gctx = graph.getContext('2d')!
      graph.width = 300
      graph.height = 300
      const gnodes: { x: number; y: number }[] = []
      const drawGraph = () => {
        gctx.clearRect(0, 0, 300, 300)
        for (let i = 0; i < gnodes.length; i++) {
          for (let j = i + 1; j < gnodes.length; j++) {
            gctx.strokeStyle = '#6fb3a9'
            gctx.globalAlpha = 0.5
            gctx.lineWidth = 1
            gctx.beginPath()
            gctx.moveTo(gnodes[i].x, gnodes[i].y)
            gctx.lineTo(gnodes[j].x, gnodes[j].y)
            gctx.stroke()
          }
        }
        gctx.globalAlpha = 1
        gctx.fillStyle = '#d24a32'
        gnodes.forEach((n) => {
          gctx.beginPath()
          gctx.arc(n.x, n.y, 4, 0, 6.28)
          gctx.fill()
        })
      }
      const figObs = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              gnodes.push({ x: 40 + Math.random() * 220, y: 40 + Math.random() * 220 })
              drawGraph()
            }
          }),
        { threshold: 0.4 },
      )
      root.querySelectorAll('.im-figure').forEach((f) => figObs.observe(f))

      // Progress + evolving scene + plexus intensity tied to scroll.
      const onScroll = () => {
        const h = document.documentElement.scrollHeight - window.innerHeight
        const p = h > 0 ? Math.min(1, window.scrollY / h) : 0
        if (progRef.current) progRef.current.style.width = p * 100 + '%'
        const ti = Math.min(THEMES.length - 1, Math.floor(p * THEMES.length))
        if (bgRef.current) bgRef.current.style.background = THEMES[ti]
        lineColorRef.current = LINE_COLORS[ti]
        setIntensity(0.2 + p * 0.6)
        if (p > 0.15) {
          graphRef.current?.classList.add('show')
          graphLabelRef.current?.classList.add('show')
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()

      return () => {
        io.disconnect()
        figObs.disconnect()
        window.removeEventListener('scroll', onScroll)
      }
    }
  }, [blocks.length])

  // Entity micro-plexus on hover.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
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
        cloud.life -= 0.014
        const al = Math.max(0, cloud.life)
        cloud.pts.forEach((p, i) => {
          lctx.strokeStyle = '#6fb3a9'
          lctx.globalAlpha = al * 0.5
          lctx.lineWidth = 0.7
          lctx.beginPath()
          lctx.moveTo(cloud!.cx, cloud!.cy)
          lctx.lineTo(p.x, p.y)
          lctx.stroke()
          lctx.fillStyle = '#d24a32'
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

    const ents = Array.from(document.querySelectorAll<HTMLElement>('.im-entity'))
    const enter = (en: HTMLElement) => () => {
      const r = en.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const pts = []
      for (let i = 0; i < 9; i++) {
        const a = Math.random() * 6.28
        const rr = 24 + Math.random() * 54
        pts.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr })
      }
      cloud = { cx, cy, pts, life: 1 }
    }
    const cleaners: Array<() => void> = []
    ents.forEach((en) => {
      const e = enter(en)
      en.addEventListener('mouseenter', e)
      cleaners.push(() => en.removeEventListener('mouseenter', e))
    })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      cleaners.forEach((fn) => fn())
    }
  }, [])

  return (
    <div
      className="landing landing--immersive"
      ref={containerRef}
      style={designCssVars(data.design ?? DEFAULT_DESIGN) as CSSProperties}
    >
      {/* The immersive backdrop is the evolving im-bg gradient. The floating
          plexus cluster read as a purposeless web at the top of the hero, so
          it's removed here (the simulation still drives the other 3 layouts). */}
      <div className="im-bg" ref={bgRef} />
      <canvas ref={linksRef} className="im-links" aria-hidden />
      <div className="im-progress" ref={progRef} />
      <canvas ref={graphRef} className="im-graph" aria-hidden />
      <div className="im-graph-label" ref={graphLabelRef}>
        Story connections
      </div>

      <Masthead sections={data.sections} labels={data.labels} />

      <header className="im-hero">
        {hero && <span className="im-kicker">{hero.kicker}</span>}
        <h1>{hero ? hero.headline : 'ReportersDesk'}</h1>
        {hero?.strap && <p className="im-sub">{hero.strap}</p>}
        {hero && (
          <a className="audio-toggle" href={hero.href}>
            {hero.kind === 'story' ? storyCtaLabel(hero.href) : 'Explore the desk →'}
          </a>
        )}
      </header>

      <main className="im-flow">
        {blocks.map((c, i) =>
          c.isFigure ? (
            <figure className="im-figure" key={i}>
              {c.heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.heroUrl} alt="" />
              ) : null}
              <figcaption>
                <a className="im-entity" href={c.href}>
                  {c.headline}
                </a>{' '}
                — {c.kicker}
              </figcaption>
            </figure>
          ) : (
            <div className="im-block" key={i}>
              <span className="im-kicker">{c.kicker}</span>
              <p>
                <a className="im-entity" href={c.href}>
                  {c.headline}
                </a>
                {c.strap ? ` — ${c.strap}` : null}
              </p>
            </div>
          ),
        )}

        <blockquote className="im-quote">
          “Independent ground reportage means walking the distance between policy and the people
          left to live with it.”
        </blockquote>

        {latestEpisode && (
          <aside className="im-pod" aria-label="Latest from the podcast">
            <Link className="im-pod-card" href={`/podcast/${latestEpisode.slug}`}>
              {latestEpisode.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="im-pod-cover" src={latestEpisode.coverUrl} alt="" />
              ) : (
                <span className="im-pod-cover im-pod-cover--ph" aria-hidden>
                  ▶
                </span>
              )}
              <span className="im-pod-body">
                <span className="im-pod-eyebrow">
                  Latest podcast
                  {latestEpisode.episodeNumber != null && (
                    <span className="im-pod-num"> · EP {latestEpisode.episodeNumber}</span>
                  )}
                  {latestEpisode.duration && (
                    <span className="im-pod-dur"> · {latestEpisode.duration}</span>
                  )}
                </span>
                <span className="im-pod-title">{latestEpisode.title}</span>
                {latestEpisode.dek && <span className="im-pod-dek">{latestEpisode.dek}</span>}
                <span className="im-pod-cta">Listen to the episode →</span>
              </span>
            </Link>
            <Link className="im-pod-all" href="/podcast">
              Browse all episodes →
            </Link>
          </aside>
        )}
      </main>
    </div>
  )
}
