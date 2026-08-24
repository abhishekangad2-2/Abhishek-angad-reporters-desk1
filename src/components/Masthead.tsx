import Link from 'next/link'
import type { LandingSection } from '@/lib/landing'

/** Shared shell masthead — clean top bar: a bold wordmark + byline on the left,
 *  nav on the right. Pure/client-safe; translated chrome comes in as props. */
export default function Masthead({
  labels,
}: {
  // `sections` still accepted (callers pass it); the section nav was removed.
  sections?: LandingSection[]
  labels?: { est?: string; editor?: string }
}) {
  return (
    <header className="site-masthead">
      <div className="mh-line">
        <div className="mh-brandblock">
          <Link href="/" className="mh-wordmark">
            Reporters Desk
          </Link>
          <span className="mh-sub">
            Abhishek Angad <em className="mh-sub-ink">Ink</em>
          </span>
        </div>
        <nav className="mh-nav" aria-label="Primary">
          <a href="#wire">The Wire</a>
          <a href="https://reportersdesk.abhishekangad.com">Archives ↗</a>
        </nav>
      </div>
    </header>
  )
}
