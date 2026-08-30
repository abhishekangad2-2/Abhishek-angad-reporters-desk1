import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '../lib/access'
import { unsubUrl } from '../lib/newsletterToken'
import { sendMail, mailerConfigured, mailerChannel } from '../lib/mailer'

// Minimal Lexical → HTML for newsletter content. Handles paragraphs, headings,
// bold/italic, lists, blockquotes, and links — enough for newsroom dispatches
// without a heavyweight serializer.
function lexicalToHtml(node: any): string {
  if (!node) return ''
  if (node.type === 'root') return (node.children ?? []).map(lexicalToHtml).join('')
  if (node.type === 'paragraph') return `<p>${(node.children ?? []).map(lexicalToHtml).join('')}</p>`
  if (node.type === 'heading') {
    const t = node.tag || 'h2'
    return `<${t}>${(node.children ?? []).map(lexicalToHtml).join('')}</${t}>`
  }
  if (node.type === 'list') {
    const t = node.listType === 'number' ? 'ol' : 'ul'
    return `<${t}>${(node.children ?? []).map(lexicalToHtml).join('')}</${t}>`
  }
  if (node.type === 'listitem') return `<li>${(node.children ?? []).map(lexicalToHtml).join('')}</li>`
  if (node.type === 'quote') return `<blockquote>${(node.children ?? []).map(lexicalToHtml).join('')}</blockquote>`
  if (node.type === 'link') {
    const href = node.fields?.url ?? node.url ?? '#'
    return `<a href="${href}">${(node.children ?? []).map(lexicalToHtml).join('')}</a>`
  }
  if (node.type === 'linebreak') return '<br/>'
  if (node.type === 'text') {
    let t = String(node.text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    const fmt = node.format ?? 0
    if (fmt & 1) t = `<strong>${t}</strong>`
    if (fmt & 2) t = `<em>${t}</em>`
    if (fmt & 8) t = `<u>${t}</u>`
    if (fmt & 4) t = `<s>${t}</s>`
    return t
  }
  return (node.children ?? []).map(lexicalToHtml).join('')
}

export const Newsletters: CollectionConfig = {
  slug: 'newsletters',
  access: {
    // NOT public: drafts are internal, and update→status:'sent' triggers a real
    // send to the whole subscriber list. Editors-and-above only, all operations.
    read: isEditorOrAbove,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: isEditorOrAbove,
  },
  admin: {
    useAsTitle: 'subject',
    group: 'Tools',
    defaultColumns: ['subject', 'status', 'sendDate', 'openCount', 'clickCount'],
    listSearchableFields: ['subject', 'status'],
    description: 'Newsletter campaigns — compose, schedule, send, and watch opens/clicks.',
  },
  hooks: {
    afterChange: [
      // Real Resend send when status flips to 'sent' (idempotent on the
      // transition). Fetches active subscribers, renders Lexical → HTML, and
      // dispatches in 100-recipient batches via Resend's REST API (no SDK
      // dep). Skipped if RESEND_API_KEY is missing/'none', so this is safe to
      // ship dark — a key flip in deploy.yml turns it on.
      async ({ doc, previousDoc, req, operation }) => {
        if (!(operation === 'update' && doc.status === 'sent' && previousDoc.status !== 'sent')) return
        const fromAddr =
          process.env.NEWSLETTER_FROM || process.env.SMTP_USER || 'newsletters@reporters-desk.org'
        if (!mailerConfigured()) {
          req.payload.logger.warn(`[Newsletter] No mail transport (SMTP/Resend) set — '${doc.subject}' not dispatched.`)
          return
        }
        try {
          const subs = await req.payload.find({
            collection: 'newsletter-subscribers',
            where: { status: { equals: 'active' } },
            limit: 10000,
            depth: 0,
          })
          const recipients = subs.docs.map((s: any) => s.email).filter(Boolean)
          if (!recipients.length) {
            req.payload.logger.info('[Newsletter] no active subscribers')
            return
          }
          const body = lexicalToHtml((doc as any).content?.root)
          // Per-recipient send so each gets a personalised, one-click unsubscribe
          // link (required for deliverability + compliance).
          let ok = 0, fail = 0
          for (const email of recipients) {
            const unsub = unsubUrl(email)
            const html = `<div style="font-family:Georgia,serif;line-height:1.6;color:#14171c;max-width:640px;margin:auto;padding:24px"><h1 style="font-family:Georgia,serif">${doc.subject}</h1>${body}<hr style="margin:32px 0;border:0;border-top:1px solid #ddd"/><p style="font-size:12px;color:#666">ReportersDesk · Abhishek Angad Ink<br/><a href="${unsub}" style="color:#666">Unsubscribe</a></p></div>`
            const sent = await sendMail({
              from: fromAddr,
              to: email,
              subject: doc.subject,
              html,
              headers: {
                'List-Unsubscribe': `<${unsub}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            })
            if (sent) ok++
            else { fail++; req.payload.logger.error(`[Newsletter] send failed for ${email}`) }
          }
          req.payload.logger.info(`[Newsletter] '${doc.subject}' dispatched via ${mailerChannel()}: ${ok} sent, ${fail} failed`)
        } catch (err) {
          req.payload.logger.error('[Newsletter] dispatch failed: ' + String(err))
        }
      }
    ]
  },
  fields: [
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Scheduled', value: 'scheduled' },
      ],
      defaultValue: 'draft',
    },
    {
      name: 'sendDate',
      type: 'date',
    },
    {
      name: 'template',
      type: 'select',
      options: [
        { label: 'Standard News', value: 'standard' },
        { label: 'Breaking Alert', value: 'breaking' },
        { label: 'Weekend Read', value: 'weekend' },
      ],
      defaultValue: 'standard',
    },
    {
      name: 'openCount',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'clickCount',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
  ],
}
