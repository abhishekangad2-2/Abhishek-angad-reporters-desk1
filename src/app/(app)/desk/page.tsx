/* eslint-disable @next/next/no-html-link-for-pages */
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import './desk.css'

// AEC — custom editorial Dashboard. A gated, in-app overview distinct from the
// Payload /cms admin, reading live data. Editors+ only.
export const dynamic = 'force-dynamic'

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

const NAV = [
  { group: 'Workspace', items: [['Dashboard', '/desk', true], ['Content', '/cms/collections/stories'], ['Media Library', '/cms/collections/media']] },
  { group: 'Engagement', items: [['Polls', '/cms/collections/polls'], ['Newsletter', '/cms/collections/newsletter-subscribers'], ['Live Dispatches', '/cms/collections/live-dispatches'], ['Patronage', '/cms/collections/payments']] },
  { group: 'Tools', items: [['Translation', '/cms/globals/integrations'], ['Analytics', '/cms/globals/integrations']] },
  { group: 'Admin', items: [['Roles & Access', '/cms/collections/users'], ['Settings', '/cms/globals/integrations']] },
]

export default async function Desk() {
  const payload = await getPayload({ config })
  const { user } = await safe(async () => payload.auth({ headers: await headers() }), { user: null } as any)
  if (!user || !(user.role === 'admin' || user.role === 'editor')) redirect('/admin-login')

  const count = (where: any) => safe(() => payload.count({ collection: 'stories', where }).then((r) => r.totalDocs), 0)
  const [drafts, review, scheduled, published] = await Promise.all([
    count({ status: { equals: 'draft' } }),
    count({ status: { equals: 'in-review' } }),
    count({ status: { equals: 'scheduled' } }),
    count({ status: { equals: 'published' } }),
  ])
  const recent = await safe(
    () => payload.find({ collection: 'stories', sort: '-updatedAt', depth: 1, limit: 6 }).then((r) => r.docs as any[]),
    [],
  )
  const subscribers = await safe(
    () => payload.count({ collection: 'newsletter-subscribers', where: { status: { equals: 'active' } } }).then((r) => r.totalDocs),
    0,
  )
  const dispatches = await safe(
    () => payload.find({ collection: 'live-dispatches', sort: '-publishedAt', limit: 4 }).then((r) => r.docs as any[]),
    [],
  )
  const payments = await safe(
    () => payload.find({ collection: 'payments', where: { status: { equals: 'captured' } }, sort: '-paidAt', limit: 50 }).then((r) => r.docs as any[]),
    [],
  )
  const patronageTotal = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const fmtINR = (n: number) => '₹' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n >= 1000 ? (n / 1000).toFixed(0) + 'k' : String(n))
  const badge = (s: string) =>
    s === 'published' ? 'pub' : s === 'scheduled' ? 'sched' : s === 'in-review' ? 'review' : 'draft'

  return (
    <div className="aec-body">
      <aside className="aec-side">
        <div className="aec-brand"><div className="lt">ReportersDesk</div><div className="by">AEC · Editorial Canvas</div></div>
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="aec-navgroup">{g.group}</div>
            {g.items.map(([label, href, on]) => (
              <a key={label as string} className={`aec-navlink${on ? ' on' : ''}`} href={href as string}>{label}</a>
            ))}
          </div>
        ))}
        <div className="aec-side-foot"><span className="aec-avatar">{(user.name || user.email || 'AA').slice(0, 2).toUpperCase()}</span><div><div className="nm">{user.name || user.email}</div><div className="rl">{user.role} · 2FA</div></div></div>
      </aside>

      <main className="aec-main">
        <div className="aec-top">
          <div><h1>Dashboard</h1><div className="sub">Editorial overview · live data</div></div>
          <div className="aec-top-actions">
            <a className="aec-btn" href="/">View site ↗</a>
            <a className="aec-btn primary" href="/cms/collections/stories/create">+ New story</a>
          </div>
        </div>

        <div className="aec-content">
          <div className="aec-stats">
            <div className="aec-stat"><div className="lbl">Drafts</div><div className="num">{drafts}</div><div className="delta">{review} in review</div></div>
            <div className="aec-stat"><div className="lbl">Published</div><div className="num">{published}</div><div className="delta">{scheduled} scheduled</div></div>
            <div className="aec-stat"><div className="lbl">Subscribers</div><div className="num">{subscribers.toLocaleString('en-IN')}</div><div className="delta">newsletter</div></div>
            <div className="aec-stat"><div className="lbl">Patronage</div><div className="num">{fmtINR(patronageTotal)}</div><div className="delta">{payments.length} contributions</div></div>
          </div>

          <div className="aec-grid">
            <div>
              <div className="aec-panel">
                <h2>Content queue <a href="/cms/collections/stories">Open in CMS →</a></h2>
                {recent.length === 0 && <p className="aec-empty">No stories yet.</p>}
                {recent.map((s) => (
                  <div className="aec-row" key={s.id}>
                    <div>
                      <div className="ti">{s.headline ?? 'Untitled'}</div>
                      <div className="me">{(s.section?.name ?? '—')} · {s.author?.[0]?.name ?? s.author?.[0]?.email ?? '—'}</div>
                    </div>
                    <span className={`aec-badge ${badge(s.status)}`}>{s.status ?? 'draft'}</span>
                    <span className="me" suppressHydrationWarning>{s.updatedAt ? new Date(s.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="aec-panel">
                <h2>Dispatches <a href="/desk/dispatch">+ File from phone →</a></h2>
                {dispatches.length === 0 && <p className="aec-empty">No dispatches.</p>}
                {dispatches.map((d) => (
                  <div className="aec-task" key={d.id}>
                    <span className={`dot ${d.significance === 'breaking' ? 'hi' : d.significance === 'significant' ? 'md' : 'lo'}`} />
                    <div>{d.headline}<div className="me">{d.initials ?? 'RD'} · {d.significance ?? 'normal'}</div></div>
                  </div>
                ))}
              </div>
              <div className="aec-panel">
                <h2>Recent patronage</h2>
                {payments.length === 0 && <p className="aec-empty">No contributions yet.</p>}
                {payments.slice(0, 4).map((p) => (
                  <div className="aec-row" key={p.id}>
                    <div className="ti">{fmtINR(Number(p.amount) || 0)}</div>
                    <span className="me" suppressHydrationWarning>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
