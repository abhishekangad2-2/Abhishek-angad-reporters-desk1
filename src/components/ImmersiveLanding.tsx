'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Masthead from './Masthead'
import PlexusBackground from './PlexusBackground'
import type { LandingData } from '@/lib/landing'

/** Phase 9 — immersive scrollytelling. Plexus is load-bearing: its density
 *  and brightness are tied to scroll progress, so the network "connects more
 *  dots" as the reader descends. Footer + Live Dispatches come from the
 *  shared shell in layout.tsx. */
export default function ImmersiveLanding({ data }: { data: LandingData }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [intensity, setIntensity] = useState(0.25)

  const [lead, ...rest] = data.stories
  const panels = rest.slice(0, 5)

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
      <Masthead sections={data.sections} />

      <header className="immersive-hero">
        {lead && <span className="three-col-section">{lead.sectionName}</span>}
        <h1>{lead ? lead.headline : 'ReportersDesk'}</h1>
        {lead && <p className="immersive-strap">{lead.strap}</p>}
        {lead && (
          <a className="audio-toggle" href={lead.href}>
            Read the investigation →
          </a>
        )}
        {panels.length > 0 && <span className="immersive-scrollcue">Scroll ↓</span>}
      </header>

      {panels.map((s) => (
        <section
          key={s.id}
          className="chapter"
          style={s.heroUrl ? { backgroundImage: `url(${s.heroUrl})` } : undefined}
        >
          <div className="chapter-text">
            <span className="three-col-section">{s.sectionName}</span>
            <h2>{s.headline}</h2>
            <p>{s.strap}</p>
            <a href={s.href}>Read →</a>
          </div>
        </section>
      ))}
    </div>
  )
}
