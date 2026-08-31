import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendMail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const recent = new Map<string, number>() // ip -> last ts (light anti-spam)

const AMOUNT_BY_TIER: Record<string, number> = { reader: 5000, foi: 10000 }
const TIER_LABEL: Record<string, string> = { reader: 'Reader', foi: 'FOI Patron', other: 'Supporter' }

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim()
  if (Date.now() - (recent.get(ip) ?? 0) < 4000) {
    return NextResponse.json({ error: 'Please wait a moment and try again.' }, { status: 429 })
  }
  recent.set(ip, Date.now())

  let data: any
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 })
  }

  const email = String(data.email ?? '').trim().toLowerCase()
  const name = String(data.name ?? '').trim().slice(0, 120)
  const upiReference = String(data.upiReference ?? '').trim().slice(0, 60)
  const tier = ['reader', 'foi', 'other'].includes(data.tier) ? data.tier : 'reader'
  const amount = Number(data.amount) > 0 ? Math.round(Number(data.amount)) : (AMOUNT_BY_TIER[tier] ?? undefined)
  const newsletterOptIn = data.newsletterOptIn !== false

  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })

  try {
    const payload = await getPayload({ config })

    const doc = await payload.create({
      collection: 'supporters' as any,
      data: { name, email, amount, tier, upiReference, newsletterOptIn, status: 'pending' },
      overrideAccess: true,
    })
    const referenceId = `RD-${String(doc.id).padStart(6, '0')}`
    await payload.update({ collection: 'supporters' as any, id: doc.id, data: { referenceId }, overrideAccess: true })

    // Optionally add them to the newsletter.
    if (newsletterOptIn) {
      try {
        const existing = await payload.find({
          collection: 'newsletter-subscribers',
          where: { email: { equals: email } },
          limit: 1,
          depth: 0,
        })
        if (!existing.docs[0]) {
          await payload.create({
            collection: 'newsletter-subscribers',
            data: { email, status: 'active', source: 'support' } as any,
            overrideAccess: true,
          })
        }
      } catch {
        /* non-fatal */
      }
    }

    // Receipt email (best-effort).
    try {
      const amtStr = amount ? `₹${amount.toLocaleString('en-IN')}` : ''
      const html = `<div style="font-family:Georgia,serif;line-height:1.6;color:#14171c;max-width:560px;margin:auto;padding:24px">
        <h1 style="font-family:Georgia,serif">Thank you for supporting Reporters Desk</h1>
        <p>${name ? `Dear ${name},` : 'Hello,'}</p>
        <p>Thank you for choosing to support independent, reader-funded journalism${amtStr ? ` with <b>${amtStr}</b>` : ''} (${TIER_LABEL[tier]}). If you haven't completed the UPI payment yet, please do — it goes directly to Abhishek Angad.</p>
        <p style="background:#f2f0ea;border:1px solid #e4e1d8;border-radius:8px;padding:12px 16px">
          Your reference ID: <b>${referenceId}</b>${upiReference ? `<br/>UPI reference: ${upiReference}` : ''}
        </p>
        <p style="font-size:13px;color:#666">Keep this reference for your records. Questions? Just reply to this email.</p>
        <hr style="margin:28px 0;border:0;border-top:1px solid #ddd"/>
        <p style="font-size:12px;color:#666">Reporters Desk · Abhishek Angad Ink</p>
      </div>`
      await sendMail({
        from: process.env.NEWSLETTER_FROM || process.env.SMTP_USER || 'abhishek.angad@reporters-desk.org',
        to: email,
        subject: `Thank you — your Reporters Desk contribution (${referenceId})`,
        html,
      })
    } catch {
      /* receipt is best-effort; the record is saved regardless */
    }

    return NextResponse.json({ ok: true, referenceId })
  } catch {
    return NextResponse.json({ error: 'Could not save. Please try again.' }, { status: 500 })
  }
}
