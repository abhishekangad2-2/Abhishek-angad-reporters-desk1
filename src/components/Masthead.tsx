import Link from 'next/link'
import type { LandingSection } from '@/lib/landing'

/** The shared shell masthead — rendered identically by all four landing
 *  templates. Colours come from `currentColor`, so it inverts automatically
 *  on the dark immersive template without a separate variant. */
export default function Masthead({ sections = [] }: { sections?: LandingSection[] }) {
  return (
    <header className="site-masthead">
      <div className="mh-bar">
        <span className="mh-eyebrow">Est. 2026</span>
        <Link href="/admin" className="mh-editor">
          Editor login
        </Link>
      </div>

      <div className="mh-brand">
        <span className="mh-sub">Abhishek Angad Ink.</span>
        <Link href="/" className="mh-wordmark">
          ReportersDesk
        </Link>
      </div>

      {sections.length > 0 && (
        <nav className="mh-nav" aria-label="Editorial desks">
          {sections.map((s) => (
            <Link key={s.slug} href={`/${s.slug}`} className="mh-nav-link">
              {s.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
