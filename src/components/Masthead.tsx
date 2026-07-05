import Link from 'next/link'
import type { LandingSection } from '@/lib/landing'

/** The shared shell masthead — pure, client+server safe. Translated chrome
 *  strings are passed in as props by the (server) caller so this file never
 *  pulls server-only Vertex deps into the client bundle. */
export default function Masthead({
  sections = [],
  labels,
}: {
  sections?: LandingSection[]
  labels?: { est?: string; editor?: string }
}) {
  const est = labels?.est || 'Est. 2026'

  return (
    <header className="site-masthead">
      <div className="mh-bar">
        <span className="mh-eyebrow">{est}</span>
      </div>

      <div className="mh-brand">
        <Link href="/" className="mh-wordmark">
          Reporters Desk
        </Link>
        <span className="mh-sub">
          Abhishek Angad <em className="mh-sub-ink">INK</em>
        </span>
      </div>

    </header>
  )
}
