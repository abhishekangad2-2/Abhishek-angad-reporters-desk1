import Link from 'next/link'
import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import { translateBatch } from '@/lib/translate.server'
import type { LandingSection } from '@/lib/landing'

/** The shared shell masthead — rendered identically by all four landing
 *  templates. Reads the locale cookie and translates the small UI labels
 *  (eyebrow, editor-login button) so the chrome matches the chosen language. */
export default async function Masthead({ sections = [] }: { sections?: LandingSection[] }) {
  const raw = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  const [estLabel, editorLabel] = await translateBatch(['Est. 2026', 'Editor login'], locale)

  return (
    <header className="site-masthead">
      <div className="mh-bar">
        <span className="mh-eyebrow">{estLabel}</span>
        <Link href="/admin" className="mh-editor">
          {editorLabel}
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
