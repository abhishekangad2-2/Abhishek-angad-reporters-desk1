'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Story } from '@/payload-types'
import Masthead from '@/components/Masthead'
import PlexusBackground from '@/components/LazyPlexus'
import { RichTextRenderer, LayoutRenderer } from '@/components/LexicalRenderer'
import { sectionNameOf } from './storyMeta'

function mediaUrl(m: any): string | null {
  return m && typeof m === 'object' && 'url' in m ? (m.url ?? null) : null
}

/** Immersive scrollytelling (builder v1): wires the existing chapter fields —
 *  background media, per-chapter alignment, ambient audio — with GSAP
 *  scroll-driven reveals, a scroll-tied Plexus, and a reading-progress bar.
 *  Reporters author the whole piece from the CMS, no developer required. */
export default function Template4({ story }: { story: Story }) {
  const chapters: any[] = (story as any).scrollytellingChapters || []
  const layout: any[] = (story as any).layout || []
  const sectionName = sectionNameOf(story)
  const hasAudio = chapters.some((c) => mediaUrl(c.ambientAudio))

  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [intensity, setIntensity] = useState(0.25)
  const [progress, setProgress] = useState(0)
  const [audioOn, setAudioOn] = useState(false)
  const [activeAudio, setActiveAudio] = useState<string | null>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const triggers: ScrollTrigger[] = []
    const els = containerRef.current?.querySelectorAll<HTMLElement>('.chapter')

    els?.forEach((el) => {
      const textEl = el.querySelector('.chapter-text')
      if (textEl) {
        const anim = gsap.fromTo(
          textEl,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            scrollTrigger: { trigger: el, start: 'top 75%', end: 'top 30%', scrub: true },
          },
        )
        if (anim.scrollTrigger) triggers.push(anim.scrollTrigger)
      }
      const audioUrl = el.dataset.audio || ''
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive && audioUrl) setActiveAudio(audioUrl)
        },
      })
      triggers.push(st)
    })

    const prog = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setIntensity(0.2 + self.progress * 0.6)
        setProgress(self.progress)
      },
    })
    triggers.push(prog)

    return () => triggers.forEach((t) => t.kill())
  }, [])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (audioOn && activeAudio) {
      if (el.src !== activeAudio) el.src = activeAudio
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [audioOn, activeAudio])

  return (
    <div className="landing landing--immersive" ref={containerRef}>
      <PlexusBackground
        className="landing-canvas landing-canvas--fixed"
        nodeCount={120}
        color="#b43d2a"
        lineColor="#3e6b66"
        intensity={intensity}
      />
      <div className="immersive-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden />
      <Masthead />

      <header className="immersive-hero">
        <span className="three-col-section">{sectionName}</span>
        <h1>{story.headline}</h1>
        {story.strap && <p className="immersive-strap">{story.strap}</p>}
        {hasAudio && (
          <button className="audio-toggle" onClick={() => setAudioOn((o) => !o)}>
            {audioOn ? 'Pause ambient audio' : 'Play with ambient audio'}
          </button>
        )}
        {chapters.length > 0 && <span className="immersive-scrollcue">Scroll ↓</span>}
      </header>

      {chapters.length > 0 ? (
        chapters.map((c, i) => {
          const bg = mediaUrl(c.backgroundMedia)
          const au = mediaUrl(c.ambientAudio)
          const align =
            c.alignment === 'left'
              ? 'chapter-text--left'
              : c.alignment === 'right'
                ? 'chapter-text--right'
                : ''
          return (
            <section
              key={i}
              className="chapter"
              data-audio={au ?? ''}
              style={bg ? { backgroundImage: `url(${bg})` } : undefined}
            >
              <div className={`chapter-text ${align}`}>
                {c.chapterTitle && <h2>{c.chapterTitle}</h2>}
                <RichTextRenderer content={c.content} />
              </div>
            </section>
          )
        })
      ) : (
        <section className="chapter">
          <div className="chapter-text">
            {story.caption && <p>{story.caption}</p>}
            <p>This story has no scrollytelling chapters yet.</p>
          </div>
        </section>
      )}

      {layout.length > 0 && (
        <section className="immersive-layout">
          <div className="immersive-layout-inner">
            <LayoutRenderer layout={layout} />
          </div>
        </section>
      )}

      <audio ref={audioRef} loop />
    </div>
  )
}
