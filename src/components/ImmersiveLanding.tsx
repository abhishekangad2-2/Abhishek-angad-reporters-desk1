'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Masthead from './Masthead'
import PlexusBackground from './PlexusBackground'
import { buildCards, type LandingData } from '@/lib/landing'

/** Phase 9 — immersive scrollytelling. Load-bearing Plexus tied to scroll
 *  progress; hero + chapter panels filled from real stories, backfilled with
 *  editorial desks so the scroll never dead-ends after one screen. */
export default function ImmersiveLanding({ data }: { data: LandingData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [intensity, setIntensity] = useState(0.25)

  const cards = buildCards(data, 5)
  const hero = cards[0]
  const panels = cards.slice(1, 6)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const chapterEls = containerRef.current?.querySelectorAll<HTMLElement>('.chapter')
    const triggers: ScrollTrigger[] = []

    chapterEls?.forEach((el) => {
      const anim = gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 35%', scrub: true },
        },
      )
      if (anim.scrollTrigger) triggers.push(anim.scrollTrigger)
    })

    const intensityTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => setIntensity(0.2 + self.progress * 0.6),
    })
    triggers.push(intensityTrigger)

    return () => triggers.forEach((t) => t.kill())
  }, [])

  return (
    <div className="landing landing--immersive" ref={containerRef}>
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={120}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={intensity}
      />
      <Masthead sections={data.sections} labels={data.labels} />

      <header className="immersive-hero">
        {hero && <span className="three-col-section">{hero.kicker}</span>}
        <h1>{hero ? hero.headline : 'ReportersDesk'}</h1>
        {hero && <p className="immersive-strap">{hero.strap}</p>}
        {hero && (
          <a className="audio-toggle" href={hero.href}>
            {hero.kind === 'story' ? 'Read the investigation →' : 'Explore the desk →'}
          </a>
        )}
        {panels.length > 0 && <span className="immersive-scrollcue">Scroll ↓</span>}
      </header>

      {panels.map((c, i) => (
        <section
          key={i}
          className="chapter"
          style={c.heroUrl ? { backgroundImage: `url(${c.heroUrl})` } : undefined}
        >
          <div className="chapter-text">
            <span className="three-col-section">{c.kicker}</span>
            <h2>{c.headline}</h2>
            <p>{c.strap}</p>
            <a href={c.href}>{c.kind === 'story' ? 'Read →' : 'Explore →'}</a>
          </div>
        </section>
      ))}
    </div>
  )
}
