import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { sendMail, mailerConfigured } from '@/lib/mailer'
import { unsubUrl } from '@/lib/newsletterToken'

// Email-in newsletter: a scheduled job polls the newsletters@ inbox. A message
// FROM the authorised editor is broadcast to every active subscriber; a message
// from anyone else is treated as a subscribe request. Token-gated so only the
// scheduler can invoke it.
export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Any of these addresses may broadcast (comma-separated via NEWSLETTER_SENDERS).
const AUTHORISED = (
  process.env.NEWSLETTER_SENDERS ||
  'abhishek.angad@reporters-desk.org,newsletters@reporters-desk.org'
)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)
const INBOX_ADDR = (process.env.NEWSLETTER_INBOX || 'newsletters@reporters-desk.org').toLowerCase()

async function broadcast(payload: any, subject: string, contentHtml: string) {
  const subs = await payload.find({
    collection: 'newsletter-subscribers',
    where: { status: { equals: 'active' } },
    limit: 10000,
    depth: 0,
  })
  // Never send to a broadcaster address itself — prevents a self-send loop.
  const recipients = subs.docs
    .map((s: any) => s.email)
    .filter((e: string) => e && !AUTHORISED.includes(String(e).toLowerCase()))
  const from = process.env.NEWSLETTER_FROM || process.env.SMTP_USER || AUTHORISED[0] || 'abhishek.angad@reporters-desk.org'
  let ok = 0, fail = 0
  for (const email of recipients) {
    const unsub = unsubUrl(email)
    const html = `<div style="font-family:Georgia,serif;line-height:1.6;color:#14171c;max-width:640px;margin:auto;padding:24px"><h1 style="font-family:Georgia,serif">${subject}</h1>${contentHtml}<hr style="margin:32px 0;border:0;border-top:1px solid #ddd"/><p style="font-size:12px;color:#666">ReportersDesk · Abhishek Angad Ink<br/><a href="${unsub}" style="color:#666">Unsubscribe</a></p></div>`
    const sent = await sendMail({
      from,
      to: email,
      subject,
      html,
      headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    })
    sent ? ok++ : fail++
  }
  return { total: recipients.length, ok, fail }
}

async function addSubscriber(payload: any, email: string): Promise<string> {
  const existing = await payload.find({
    collection: 'newsletter-subscribers',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs[0]) {
    if (existing.docs[0].status !== 'active') {
      await payload.update({ collection: 'newsletter-subscribers', id: existing.docs[0].id, data: { status: 'active' }, overrideAccess: true })
      return 'reactivated'
    }
    return 'already'
  }
  await payload.create({ collection: 'newsletter-subscribers', data: { email, status: 'active', source: 'email' }, overrideAccess: true })
  return 'added'
}

export async function POST(req: NextRequest) {
  const token = process.env.INBOX_TOKEN
  if (!token || req.headers.get('x-inbox-token') !== token) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass || !mailerConfigured()) {
    return NextResponse.json({ error: 'mail transport not configured' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const client = new ImapFlow({ host: 'imap.gmail.com', port: 993, secure: true, auth: { user, pass }, logger: false })
  const out: any = { broadcasts: 0, subscribed: 0, skipped: 0, errors: [] as string[] }

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    try {
      // ONLY unseen mail addressed to the newsletter inbox — never touches
      // personal mail (so it can't mark your other emails as read).
      const uids = (await client.search({ seen: false, to: INBOX_ADDR }, { uid: true })) || []
      for (const uid of uids as number[]) {
        try {
          const msg = await client.fetchOne(String(uid), { source: true }, { uid: true })
          if (!msg || !(msg as any).source) continue
          const mail = await simpleParser((msg as any).source)
          const from = (mail.from?.value?.[0]?.address || '').toLowerCase()
          const toAddrs = ([] as string[]).concat(
            (mail.to as any)?.value?.map((a: any) => (a.address || '').toLowerCase()) || [],
            (mail.cc as any)?.value?.map((a: any) => (a.address || '').toLowerCase()) || [],
          )
          const subject = mail.subject || '(no subject)'
          const contentHtml = mail.html || (mail.text ? `<p>${String(mail.text).replace(/\n/g, '<br/>')}</p>` : '')

          // Only act on mail actually addressed to the newsletter inbox — this
          // also stops the broadcast's own copies (addressed to subscribers)
          // from being reprocessed.
          if (!toAddrs.includes(INBOX_ADDR)) {
            out.skipped++
          } else if (AUTHORISED.includes(from)) {
            out.lastBroadcast = await broadcast(payload, subject, contentHtml)
            out.broadcasts++
          } else if (from) {
            await addSubscriber(payload, from)
            out.subscribed++
          }
          await client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true })
        } catch (e) {
          out.errors.push(String((e as Error).message || e))
        }
      }
    } finally {
      lock.release()
    }
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message || e) }, { status: 500 })
  } finally {
    try { await client.logout() } catch {}
  }

  return NextResponse.json(out)
}
