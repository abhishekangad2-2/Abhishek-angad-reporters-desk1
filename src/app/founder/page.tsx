'use client'

import { useEffect, useRef } from 'react'
import './founder.css'

const TIMELINE = [
  { year: 'The beat', title: 'Ground reportage from Jharkhand & eastern India', body: 'Reporting where policy meets the people it is meant to serve — public health, the rural belt, and the distance between an entitlement on paper and a hand-pump that works.' },
  { year: 'Accountability', title: 'Following the money', body: 'Where public money was meant to go, and where it actually went — budgets, schemes, and the institutions answerable for them.' },
  { year: 'Elections', title: 'The integrity of the rolls', body: 'Booth-level scrutiny of electoral revisions and the trust deficit they expose, from the West Bengal SIR onward.' },
  { year: 'Form', title: 'Visual & audio investigations', body: 'Photo essays, field video and recorded testimony — telling the story in the medium the story demands.' },
  { year: 'Now', title: 'ReportersDesk', body: 'A reader-funded home for independent, long-form ground reportage — no paywall on the reporting, supported directly by the people who value it.' },
]

export default function FounderPage() {
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
        <img className="fd-avatar" src="https://cdn.reportersdesk.abhishekangad.com/IMG_20240801_152018.jpg" alt="Abhishek Angad" />
        <p className="fd-kicker">Founder &amp; reporter</p>
        <h1 className="fd-name">Abhishek Angad</h1>
        <p className="fd-lede">
          An independent journalist reporting from Jharkhand and eastern India — public health, the rural
          belt, electoral integrity, and where public money is spent. ReportersDesk is his reader-funded
          home for long-form ground reportage and visual investigations.
        </p>
      </header>

      <section className="fd-timeline" ref={ref}>
        {TIMELINE.map((t, i) => (
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
        <a href="/">← Back to ReportersDesk</a>
        <a href="mailto:desk@reportersdesk.abhishekangad.com">Get in touch</a>
      </footer>
    </main>
  )
}
