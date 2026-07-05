'use client'

import { type CSSProperties } from 'react'
import Masthead from './Masthead'
import SimulationBackground from './sims/SimulationBackground'
import { buildCards, type LandingData } from '@/lib/landing'
import { designCssVars, DEFAULT_DESIGN } from '@/lib/design'

/** X/Y — the Z-pattern layout. Exactly three stories stacked as alternating
 *  picture↔text rows: pic-text → text-pic → pic-text, so the reader's eye
 *  zig-zags down the page in a Z. Palette + background simulation come from the
 *  Design Studio global. */
export default function ZPatternLanding({ data }: { data: LandingData }) {
  const cards = buildCards(data, 3).slice(0, 3)
  const design = data.design ?? DEFAULT_DESIGN

  return (
    <div
      className="landing landing--z-pattern"
      style={designCssVars(design) as CSSProperties}
    >
      <SimulationBackground
        design={design}
        className="landing-canvas landing-canvas--fixed"
        densityScale={0.7}
        intensityScale={0.35}
      />
      <Masthead sections={data.sections} labels={data.labels} />

      {cards.length > 0 ? (
        <main className="zig-stage">
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
        </main>
      ) : (
        <p className="landing-empty">No published stories yet.</p>
      )}
    </div>
  )
}
