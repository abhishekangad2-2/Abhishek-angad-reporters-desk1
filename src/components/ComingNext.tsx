import Link from 'next/link'

/** Homepage teaser for the next investigation, sitting between the landing and
 *  the Wire. */
export default function ComingNext() {
  return (
    <aside className="coming-next" aria-label="Coming next">
      <div className="coming-next-inner">
        <span className="cn-kicker">
          <span className="cn-dot" aria-hidden /> Next investigation
        </span>
        <h2 className="cn-title">Internal migration and the intersectionalities</h2>
        <p className="cn-dek">
          A long-form investigation, in the works. Founding Members get it first — and help shape what we report.
        </p>
        <Link href="/support" className="cn-cta">
          Support this reporting →
        </Link>
      </div>
    </aside>
  )
}
