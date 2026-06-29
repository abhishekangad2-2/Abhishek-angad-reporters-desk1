import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// Plan configuration — single source of truth for pricing.
// The actual Razorpay plan IDs must be created in the Razorpay dashboard
// and stored as environment variables. Never hard-code amounts here for
// security; Razorpay will validate them against the plan definition.
const PLAN_MAP: Record<string, { razorpayPlanId: string; amountPaise: number }> = {
  reader: {
    razorpayPlanId: process.env.RAZORPAY_PLAN_ID_READER ?? '',
    amountPaise: 500000, // ₹5,000 in paise
  },
  'foi-patron': {
    razorpayPlanId: process.env.RAZORPAY_PLAN_ID_FOI_PATRON ?? '',
    amountPaise: 1000000, // ₹10,000 in paise
  },
}

function isConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  return Boolean(keyId && keyId !== 'none' && keySecret && keySecret !== 'none')
}

// GET is a cheap config probe for the client — lets the UI render a
// "payments not configured" state without attempting a checkout.
export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({
      configured: false,
      note: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable payments.',
    })
  }
  return NextResponse.json({
    configured: true,
    keyId: process.env.RAZORPAY_KEY_ID, // publishable key id, safe for the client
    plans: {
      reader: Boolean(process.env.RAZORPAY_PLAN_ID_READER && process.env.RAZORPAY_PLAN_ID_READER !== 'none'),
      'foi-patron': Boolean(
        process.env.RAZORPAY_PLAN_ID_FOI_PATRON && process.env.RAZORPAY_PLAN_ID_FOI_PATRON !== 'none',
      ),
    },
  })
}

export async function POST(req: NextRequest) {
  // 5 subscription creation attempts per IP per 10 minutes
  if (!checkRateLimit(`payment:${getClientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  // Graceful degradation: no Razorpay env → tell the client we're not configured
  // (200 with configured:false) instead of a 500/503 that looks like an outage.
  if (!isConfigured()) {
    return NextResponse.json({
      configured: false,
      note: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable payments.',
    })
  }

  const keyId = process.env.RAZORPAY_KEY_ID as string
  const keySecret = process.env.RAZORPAY_KEY_SECRET as string

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { plan: planId, email } = body ?? {}
  const plan = PLAN_MAP[planId]

  if (!plan) {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
  }

  if (!plan.razorpayPlanId || plan.razorpayPlanId === 'none') {
    return NextResponse.json({
      configured: false,
      note: `Razorpay plan ID not configured for the "${planId}" tier.`,
    })
  }

  try {
    // Create a Razorpay subscription via the REST API.
    // We use fetch + basic auth instead of the SDK to avoid adding a dependency
    // that doesn't have great ESM support in Next.js standalone builds.
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const razorpayRes = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: plan.razorpayPlanId,
        total_count: 12, // 12 cycles before requiring re-authorisation
        quantity: 1,
        // Surface checkout details (email) and our internal tags. These notes
        // come back on the subscription webhook so we can attribute the record.
        customer_notify: 1,
        notes: {
          plan: planId,
          email: typeof email === 'string' ? email : '',
          source: 'footer-payment-tab',
        },
      }),
    })

    const subscription = await razorpayRes.json()

    if (!razorpayRes.ok) {
      console.error('[create-subscription] Razorpay error:', subscription)
      return NextResponse.json({ error: 'Could not create subscription.' }, { status: 502 })
    }

    // Return everything the client needs: the subscription id (to open
    // Razorpay Checkout in subscription mode), the publishable key id, and the
    // hosted short_url (QR / fallback link for UPI Autopay mandate setup).
    return NextResponse.json({
      configured: true,
      subscriptionId: subscription.id,
      keyId,
      paymentUrl: subscription.short_url,
    })
  } catch (err) {
    console.error('[create-subscription] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
