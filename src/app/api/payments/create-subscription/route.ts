import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || keyId === 'none' || !keySecret || keySecret === 'none') {
    return NextResponse.json(
      { error: 'Payment gateway not configured.' },
      { status: 503 },
    )
  }

  const { plan: planId, email } = await req.json()
  const plan = PLAN_MAP[planId]

  if (!plan) {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
  }

  if (!plan.razorpayPlanId || plan.razorpayPlanId === 'none') {
    return NextResponse.json(
      { error: 'Razorpay plan ID not configured for this plan.' },
      { status: 503 },
    )
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
        total_count: 12,         // 12 cycles before requiring re-authorisation
        quantity: 1,
        notes: {
          plan: planId,
          email: email ?? '',
          source: 'footer-payment-tab',
        },
      }),
    })

    const subscription = await razorpayRes.json()

    if (!razorpayRes.ok) {
      console.error('[create-subscription] Razorpay error:', subscription)
      return NextResponse.json({ error: 'Could not create subscription.' }, { status: 502 })
    }

    // Return the short_url — Razorpay hosted payment page, handles UPI Autopay
    // mandate setup, QR generation, and everything else.
    return NextResponse.json({
      subscriptionId: subscription.id,
      paymentUrl: subscription.short_url,
    })
  } catch (err) {
    console.error('[create-subscription] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
