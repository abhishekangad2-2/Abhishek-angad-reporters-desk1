import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '../../../../payload.config'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    // Fail closed: without the secret we cannot verify authenticity, so we must
    // NOT process the event (otherwise anyone can forge payments/subscriptions).
    console.error('RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook.')
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 })
  }
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const valid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))

  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const payload = await getPayload({ config })

  switch (event.event) {
    case 'subscription.authenticated':
    case 'subscription.activated':
    case 'subscription.charged':
    case 'subscription.paused':
    case 'subscription.cancelled':
    case 'subscription.completed': {
      const sub = event.payload.subscription.entity
      const existing = await payload.find({
        collection: 'subscriptions',
        where: { razorpaySubscriptionId: { equals: sub.id } },
        limit: 1,
      })

      const data = {
        status: mapStatus(sub.status),
        currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : undefined,
        mandateType: 'upi-autopay' as const,
      }

      let subscriptionDoc
      if (existing.docs.length) {
        subscriptionDoc = await payload.update({
          collection: 'subscriptions',
          id: existing.docs[0].id,
          data,
        })
      } else {
        subscriptionDoc = await payload.create({
          collection: 'subscriptions',
          data: {
            ...data,
            razorpaySubscriptionId: sub.id,
            subscriberEmail: sub.notes?.email ?? 'unknown',
            plan: sub.notes?.plan === 'foi-patron' ? 'foi-patron' : 'reader',
          },
        })
      }

      if (event.event === 'subscription.charged' && event.payload.payment) {
        const pay = event.payload.payment.entity
        await payload.create({
          collection: 'payments',
          data: {
            subscription: subscriptionDoc.id,
            razorpayPaymentId: pay.id,
            amount: pay.amount / 100, // Razorpay sends paise
            status: 'captured',
            paidAt: new Date(pay.created_at * 1000).toISOString(),
          },
        })
      }
      break
    }

    case 'payment.failed': {
      // Surface this rather than silently dropping it — a failed UPI
      // Autopay renewal needs a human in the Payments console to follow up,
      // since the reader's access shouldn't just quietly lapse unexplained.
      const pay = event.payload.payment.entity
      await payload.create({
        collection: 'payments',
        data: {
          razorpayPaymentId: pay.id,
          amount: pay.amount / 100,
          status: 'failed',
          paidAt: new Date(pay.created_at * 1000).toISOString(),
        },
      })
      break
    }

    default:
      // Acknowledge anything not explicitly handled so Razorpay stops retrying it.
      break
  }

  return NextResponse.json({ ok: true })
}

function mapStatus(razorpayStatus: string) {
  const map: Record<string, string> = {
    created: 'created',
    authenticated: 'authenticated',
    active: 'active',
    paused: 'paused',
    cancelled: 'cancelled',
    completed: 'expired',
  }
  return map[razorpayStatus] ?? 'created'
}
