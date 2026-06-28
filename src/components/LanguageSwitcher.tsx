'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { LOCALES, LOCALE_COOKIE, localeByCode } from '@/lib/i18n'

/** Small floating language switcher. Sets the rd_lang cookie (for persistence)
 *  and navigates to ?lang=<code> with a full load, which forces a fresh server
 *  render that reads the locale and translates. */
export default function LanguageSwitcher({ current }: { current: string }) {
  const [open, setOpen] = useState(false)
  const cur = localeByCode(current)

  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const searchParams = useSearchParams()

  function pick(code: string) {
    // persist choice in a cookie for server-side reads
    document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`

    // build a new query string without mutating external values
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (code === 'en') params.delete('lang')
    else params.set('lang', code)
    const qs = params.toString()

    // navigate using next/navigation to trigger a full page load on the app router
    router.push(`${pathname}${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="lang-widget">
      {open && (
        <ul className="lang-list">
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                className={`lang-item ${l.code === current ? 'lang-item--active' : ''}`}
                onClick={() => pick(l.code)}
              >
                <span>{l.native}</span>
                <span className="lang-en">{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        className="lang-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
        aria-expanded={open}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{cur.native}</span>
      </button>
    </div>
  )
}
