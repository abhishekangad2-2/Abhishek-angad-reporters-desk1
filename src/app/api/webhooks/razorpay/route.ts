import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '../../../../payload.config'

// Razorpay sends the JSON body and an HMAC-SHA256 of the *raw* body in the
// `x-razorpay-signature` header, keyed with RAZORPAY_WEBHOOK_SECRET. We must
// verify against the raw bytes (not a re-serialised object) and compare in
// constant time. Events are idempotent: Razorpay retries until it gets a 2xx,
// so every write guards against duplicates.
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || secret === 'none') {
    // Fail closed: without the secret we cannot verify authenticity, so we must
    // NOT process the event (otherwise anyone can forge payments/subscriptions).
    console.error('RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook.')
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 })
  }

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  try {
    switch (event.event) {
      case 'subscription.authenticated':
      case 'subscription.activated':
      case 'subscription.charged':
      case 'subscription.paused':
      case 'subscription.cancelled':
      case 'subscription.completed': {
        const sub = event.payload?.subscription?.entity
        if (!sub?.id) break

        const existing = await payload.find({
          collection: 'subscriptions',
          where: { razorpaySubscriptionId: { equals: sub.id } },
          limit: 1,
        })

        const data = {
          status: mapStatus(sub.status),
          currentPeriodEnd: sub.current_end
            ? new Date(sub.current_end * 1000).toISOString()
            : undefined,
          mandateType: 'upi-autopay' as const,
        }

        let subscriptionDocId: string | number
        if (existing.docs.length) {
          subscriptionDocId = existing.docs[0].id
          await payload.update({
            collection: 'subscriptions',
            id: subscriptionDocId,
            data,
          })
        } else {
          const created = await payload.create({
            collection: 'subscriptions',
            data: {
              ...data,
              razorpaySubscriptionId: sub.id,
              subscriberEmail: sub.notes?.email ?? 'unknown',
              plan: sub.notes?.plan === 'foi-patron' ? 'foi-patron' : 'reader',
            },
          })
          subscriptionDocId = created.id
        }

        if (event.event === 'subscription.charged' && event.payload?.payment?.entity) {
          const pay = event.payload.payment.entity
          await recordPayment(payload, {
            razorpayPaymentId: pay.id,
            subscription: subscriptionDocId,
            amount: pay.amount / 100, // Razorpay sends paise
            status: 'captured',
            paidAt: pay.created_at ? new Date(pay.created_at * 1000).toISOString() : undefined,
          })
        }
        break
      }

      case 'payment.failed': {
        // Surface this rather than silently dropping it — a failed UPI Autopay
        // renewal needs a human in the Payments console to follow up, since the
        // reader's access shouldn't just quietly lapse unexplained.
        const pay = event.payload?.payment?.entity
        if (!pay?.id) break
        await recordPayment(payload, {
          razorpayPaymentId: pay.id,
          amount: pay.amount / 100,
          status: 'failed',
          paidAt: pay.created_at ? new Date(pay.created_at * 1000).toISOString() : undefined,
        })
        break
      }

      default:
        // Acknowledge anything not explicitly handled so Razorpay stops retrying it.
        break
    }
  } catch (err) {
    // A 5xx makes Razorpay retry, which is what we want for transient DB errors.
    console.error('[razorpay-webhook] processing error:', err)
    return NextResponse.json({ error: 'Processing error.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  // Decode the provided hex signature. Malformed hex yields a shorter buffer;
  // the length check below rejects it before timingSafeEqual (which throws on
  // unequal lengths).
  let providedBuf: Buffer
  try {
    providedBuf = Buffer.from(signature, 'hex')
  } catch {
    return false
  }
  if (providedBuf.length !== expectedBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, providedBuf)
}

// Idempotent payment write: razorpayPaymentId is unique, and Razorpay retries
// deliver the same payment id, so skip if it already exists rather than letting
// the unique constraint throw (which would 500 and trigger infinite retries).
async function recordPayment(
  payload: Awaited<ReturnType<typeof getPayload>>,
  data: {
    razorpayPaymentId: string
    subscription?: string | number
    amount: number
    status: 'captured' | 'failed'
    paidAt?: string
  },
) {
  const existing = await payload.find({
    collection: 'payments',
    where: { razorpayPaymentId: { equals: data.razorpayPaymentId } },
    limit: 1,
  })
  if (existing.docs.length) return
  await payload.create({ collection: 'payments', data })
}

function mapStatus(razorpayStatus: string) {
  const map: Record<string, string> = {
    created: 'created',
    authenticated: 'authenticated',
    active: 'active',
    paused: 'paused',
    halted: 'paused',
    cancelled: 'cancelled',
    completed: 'expired',
    expired: 'expired',
  }
  return map[razorpayStatus] ?? 'created'
}
