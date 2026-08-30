/* eslint-disable @next/next/no-html-link-for-pages */
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getGaTraffic } from '@/lib/ga'
import '../desk.css'

// Analytics — a lightweight, first-party engagement dashboard. Deliberately
// distinct from Google Analytics: GA measures traffic (sessions, pageviews,
// sources); this reads the newsroom's own owned data (subscribers, tips, poll
// votes, comments, dispatches, patronage) straight from the CMS. Editors+ only.
export const dynamic = 'force-dynamic'

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

const NAV = [
  { group: 'Workspace', items: [['Dashboard', '/desk'], ['Content', '/cms/collections/stories'], ['Media Library', '/cms/collections/media']] },
  { group: 'Engagement', items: [['Polls', '/cms/collections/polls'], ['Newsletter', '/cms/collections/newsletter-subscribers'], ['Live Dispatches', '/cms/collections/live-dispatches'], ['Patronage', '/cms/collections/payments']] },
  { group: 'Tools', items: [['Comments', '/cms/collections/comments'], ['Analytics', '/desk/insights', true]] },
  { group: 'Admin', items: [['Roles & Access', '/cms/collections/users'], ['Settings', '/cms/globals/integrations']] },
]

export default async function Insights() {
  const payload = await getPayload({ config })
  const { user } = await safe(async () => payload.auth({ headers: await headers() }), { user: null } as any)
  if (!user || !(user.role === 'admin' || user.role === 'editor')) redirect('/admin-login')

  const countOf = (collection: string, where?: any) =>
    safe(() => payload.count({ collection: collection as any, where }).then((r) => r.totalDocs), 0)

  const [subscribers, tips, rti, comments, dispatches, publishedStories, pollCount] = await Promise.all([
    countOf('newsletter-subscribers', { status: { equals: 'active' } }),
    countOf('investigate-requests'),
    countOf('rti-requests'),
    countOf('comments', { status: { equals: 'visible' } }),
    countOf('live-dispatches'),
    countOf('stories', { status: { equals: 'published' } }),
    countOf('polls'),
  ])

  // Poll votes — summed across every poll's options.
  const polls = await safe(
    () => payload.find({ collection: 'polls', depth: 0, limit: 200 }).then((r) => r.docs as any[]),
    [],
  )
  const pollVotes = polls.reduce(
    (sum, p) => sum + (Array.isArray(p.options) ? p.options.reduce((s: number, o: any) => s + (Number(o.voteCount) || 0), 0) : 0),
    0,
  )
  const topPolls = polls
    .map((p) => ({
      question: p.question ?? 'Untitled poll',
      votes: Array.isArray(p.options) ? p.options.reduce((s: number, o: any) => s + (Number(o.voteCount) || 0), 0) : 0,
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5)

  // Live Google Analytics traffic (last 28 days) — null until GA_PROPERTY_ID is
  // set and the runtime service account has GA access; the panel is then hidden.
  const ga = await getGaTraffic(28)

  const payments = await safe(
    () => payload.find({ collection: 'payments', where: { status: { equals: 'captured' } }, sort: '-paidAt', limit: 200 }).then((r) => r.docs as any[]),
    [],
  )
  const patronageTotal = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const fmtINR = (n: number) => '₹' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n >= 1000 ? (n / 1000).toFixed(0) + 'k' : String(n))
  const nf = (n: number) => n.toLocaleString('en-IN')

  const stats: { lbl: string; num: string; delta: string }[] = [
    { lbl: 'Newsletter subscribers', num: nf(subscribers), delta: 'active opt-ins' },
    { lbl: 'Investigation tips', num: nf(tips), delta: 'reader leads' },
    { lbl: 'Poll votes', num: nf(pollVotes), delta: `${pollCount} poll${pollCount === 1 ? '' : 's'}` },
    { lbl: 'Comments', num: nf(comments), delta: 'visible on stories' },
    { lbl: 'Live dispatches', num: nf(dispatches), delta: 'filed' },
    { lbl: 'RTI requests', num: nf(rti), delta: 'logged' },
    { lbl: 'Published stories', num: nf(publishedStories), delta: 'live' },
    { lbl: 'Patronage', num: fmtINR(patronageTotal), delta: `${payments.length} contributions` },
  ]

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
          <div><h1>Analytics</h1><div className="sub">First-party engagement · live data — distinct from Google Analytics traffic</div></div>
          <div className="aec-top-actions">
            <a className="aec-btn" href="/desk">← Dashboard</a>
          </div>
        </div>

        <div className="aec-content">
          <div className="aec-stats">
            {stats.map((s) => (
              <div className="aec-stat" key={s.lbl}>
                <div className="lbl">{s.lbl}</div>
                <div className="num">{s.num}</div>
                <div className="delta">{s.delta}</div>
              </div>
            ))}
          </div>

          {ga ? (
            <>
              <div className="aec-stats" style={{ marginTop: '1.25rem' }}>
                <div className="aec-stat"><div className="lbl">GA · Sessions</div><div className="num">{nf(ga.sessions)}</div><div className="delta">last {ga.rangeDays} days</div></div>
                <div className="aec-stat"><div className="lbl">GA · Pageviews</div><div className="num">{nf(ga.pageViews)}</div><div className="delta">last {ga.rangeDays} days</div></div>
                <div className="aec-stat"><div className="lbl">GA · Active users</div><div className="num">{nf(ga.activeUsers)}</div><div className="delta">last {ga.rangeDays} days</div></div>
              </div>
              {ga.topPages.length > 0 && (
                <div className="aec-panel" style={{ marginTop: '1.25rem' }}>
                  <h2>Most-viewed pages <span className="me">Google Analytics · {ga.rangeDays}d</span></h2>
                  {ga.topPages.map((p, i) => (
                    <div className="aec-row" key={i}>
                      <div className="ti">{p.path}</div>
                      <span className="me">{nf(p.views)} view{p.views === 1 ? '' : 's'}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aec-panel" style={{ marginTop: '1.25rem' }}>
              <h2>Google Analytics traffic</h2>
              <p className="aec-empty">
                Not connected yet. Set <code>GA_PROPERTY_ID</code> and grant the app’s service account
                Viewer access on the GA4 property to show live sessions, pageviews and top pages here.
              </p>
            </div>
          )}

          <div className="aec-grid">
            <div>
              <div className="aec-panel">
                <h2>Top polls by votes <a href="/cms/collections/polls">Open in CMS →</a></h2>
                {topPolls.length === 0 && <p className="aec-empty">No polls yet.</p>}
                {topPolls.map((p, i) => (
                  <div className="aec-row" key={i}>
                    <div className="ti">{p.question}</div>
                    <span className="me">{nf(p.votes)} vote{p.votes === 1 ? '' : 's'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="aec-panel">
                <h2>Where readers engage</h2>
                <div className="aec-row"><div className="ti">Leads &amp; tips</div><span className="me">{nf(tips)}</span></div>
                <div className="aec-row"><div className="ti">RTI requests</div><span className="me">{nf(rti)}</span></div>
                <div className="aec-row"><div className="ti">Comments</div><span className="me">{nf(comments)}</span></div>
                <div className="aec-row"><div className="ti">Newsletter sign-ups</div><span className="me">{nf(subscribers)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
