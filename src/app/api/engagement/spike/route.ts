import { NextResponse } from 'next/server'

// #5 Patronage-Beacon engagement signal — traffic spike. Queries the GA4 Data
// API for a path when GA_PROPERTY_ID + GA_SA_KEY (service-account JSON) are set,
// flagging a spike when recent active users exceed a threshold. Without creds it
// returns { spiking:false, configured:false } so the client beacon simply falls
// back to its dwell/scroll + editorial-flag triggers.
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const propertyId = process.env.GA_PROPERTY_ID
  const saKey = process.env.GA_SA_KEY
  if (!propertyId || !saKey) {
    return NextResponse.json({ spiking: false, configured: false })
  }
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path') || '/'
  try {
    // Non-analyzable specifier so the bundler doesn't try to resolve the
    // optional dep at build time (install @google-analytics/data to enable).
    const pkg = ['@google-analytics', 'data'].join('/')
    const mod: any = await import(/* webpackIgnore: true */ pkg).catch(() => null)
    if (!mod?.BetaAnalyticsDataClient) {
      return NextResponse.json({ spiking: false, configured: true, error: 'ga_pkg_missing' })
    }
    const client = new mod.BetaAnalyticsDataClient({ credentials: JSON.parse(saKey) })
    const [resp] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30minutesAgo', endDate: 'now' } as any],
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: {
        filter: { fieldName: 'pagePath', stringFilter: { value: path } },
      } as any,
    })
    const active = Number(resp.rows?.[0]?.metricValues?.[0]?.value || 0)
    const threshold = Number(process.env.GA_SPIKE_THRESHOLD || 50)
    return NextResponse.json({ spiking: active >= threshold, active, configured: true })
  } catch {
    return NextResponse.json({ spiking: false, configured: true, error: 'ga_failed' })
  }
}
