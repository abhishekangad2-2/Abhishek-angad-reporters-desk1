import { GoogleAuth } from 'google-auth-library'

// Server-side Google Analytics (GA4) Data API reader. Surfaces live traffic in
// the in-site /desk dashboard. Deliberately graceful: if GA_PROPERTY_ID is unset
// (or the credential lacks access, or the API is disabled), every call returns
// null and the dashboard simply omits the GA panel — nothing throws.
//
// Auth reuses Application Default Credentials (the Cloud Run runtime service
// account), the same mechanism GCS/Vertex already use here. That service
// account must be granted Viewer on the GA4 property, and the Analytics Data
// API (analyticsdata.googleapis.com) must be enabled on the project.

export type GaTraffic = {
  sessions: number
  pageViews: number
  activeUsers: number
  topPages: { path: string; views: number }[]
  rangeDays: number
}

// Cache across requests so the dashboard doesn't hit the Data API on every load
// (and stays inside GA quotas). 10 minutes is plenty for an editorial overview.
let cached: { at: number; data: GaTraffic | null } | null = null
const TTL = 10 * 60 * 1000

const DATA_API = 'https://analyticsdata.googleapis.com/v1beta'

export async function getGaTraffic(rangeDays = 28): Promise<GaTraffic | null> {
  const propertyId = process.env.GA_PROPERTY_ID
  if (!propertyId || propertyId === 'none') return null
  if (cached && Date.now() - cached.at < TTL) return cached.data

  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    })
    const client = await auth.getClient()
    const url = `${DATA_API}/properties/${propertyId}:runReport`
    const dateRanges = [{ startDate: `${rangeDays}daysAgo`, endDate: 'today' }]

    const totalsRes = (await client.request({
      url,
      method: 'POST',
      data: {
        dateRanges,
        metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }, { name: 'activeUsers' }],
      },
    })) as { data: any }
    const mv = totalsRes.data?.rows?.[0]?.metricValues ?? []
    const num = (i: number) => Number(mv[i]?.value ?? 0) || 0

    const pagesRes = (await client.request({
      url,
      method: 'POST',
      data: {
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 6,
      },
    })) as { data: any }
    const topPages = (pagesRes.data?.rows ?? []).map((r: any) => ({
      path: r.dimensionValues?.[0]?.value ?? '/',
      views: Number(r.metricValues?.[0]?.value ?? 0) || 0,
    }))

    const data: GaTraffic = {
      sessions: num(0),
      pageViews: num(1),
      activeUsers: num(2),
      topPages,
      rangeDays,
    }
    cached = { at: Date.now(), data }
    return data
  } catch {
    // Cache the null too, so a misconfiguration doesn't retry the API on every
    // dashboard load. Clears on next TTL window.
    cached = { at: Date.now(), data: null }
    return null
  }
}
