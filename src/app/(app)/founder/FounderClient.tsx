'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import './founder.css'

export type FounderContent = {
  avatar: string
  kicker: string
  name: string
  lede: string
  timeline: { year: string; title: string; body: string }[]
  back: string
  contact: string
}

// Presentation + scroll-reveal only. All copy arrives already translated from
// the server component, so this stays a thin client wrapper around the timeline
// IntersectionObserver animation.
export default function FounderClient({ content }: { content: FounderContent }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = ref.current?.querySelectorAll('.fd-step') ?? []
    if (reduce) {
      els.forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.3 },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])

  return (
    <main className="fd">
      <header className="fd-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fd-avatar" src={content.avatar} alt={content.name} />
        <p className="fd-kicker">{content.kicker}</p>
        <h1 className="fd-name">{content.name}</h1>
        <p className="fd-lede">{content.lede}</p>
      </header>

      <section className="fd-timeline" ref={ref}>
        {content.timeline.map((t, i) => (
          <div className="fd-step" key={i}>
            <div className="fd-year">{t.year}</div>
            <div className="fd-card">
              <h2>{t.title}</h2>
              <p>{t.body}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="fd-foot">
        <Link href="/">{content.back}</Link>
        <a href="mailto:desk@reporters-desk.org">{content.contact}</a>
      </footer>
    </main>
  )
}
