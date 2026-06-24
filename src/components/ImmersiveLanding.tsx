'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Masthead from '../shell/Masthead'
import FooterTabs from '../shell/FooterTabs'
import LiveDispatchesWidget from '../shell/LiveDispatches'
import PlexusBackground from '../three/PlexusBackground'
import type { ImmersiveChapter } from '../../lib/types'

gsap.registerPlugin(ScrollTrigger)

export default function ImmersiveLanding({
  headline,
  audioSrc,
  chapters,
}: {
  headline: string
  audioSrc: string
  chapters: ImmersiveChapter[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [intensity, setIntensity] = useState(0.25)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const chapterEls = containerRef.current?.querySelectorAll<HTMLElement>('.chapter')
    const triggers: ScrollTrigger[] = []

    chapterEls?.forEach((el) => {
      const anim = gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: { trigger: el, start: 'top 75%', end: 'top 25%', scrub: true },
        },
      )
      if (anim.scrollTrigger) triggers.push(anim.scrollTrigger)
    })

    // Ties the Plexus network's density/brightness directly to how far
    // into the story the reader has scrolled — the "investigation
    // connecting more dots" effect described in the design brief.
    const intensityTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => setIntensity(0.2 + self.progress * 0.6),
    })
    triggers.push(intensityTrigger)

    return () => triggers.forEach((t) => t.kill())
  }, [])

  function toggleAudio() {
    if (!audioRef.current) return
    if (playing) audioRef.current.pause()
    else audioRef.current.play()
    setPlaying(!playing)
  }

  return (
    <main className="landing landing--immersive" ref={containerRef}>
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={120}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={intensity}
      />

      <header className="immersive-hero">
        <Masthead />
        <h1>{headline}</h1>
        <button className="audio-toggle" onClick={toggleAudio}>
          {playing ? 'Pause narration' : 'Play narration'}
        </button>
        {/* For a richer scrubber with a visual waveform, swap this element
            for wavesurfer.js — kept as a plain <audio> here to ship the
            core interaction first. */}
        <audio ref={audioRef} src={audioSrc} />
      </header>

      {chapters.map((c) => (
        <section key={c.id} className="chapter" style={{ backgroundImage: `url(${c.backgroundImage})` }}>
          <p className="chapter-text">{c.text}</p>
        </section>
      ))}

      <LiveDispatchesWidget />
      <FooterTabs />
    </main>
  )
}
