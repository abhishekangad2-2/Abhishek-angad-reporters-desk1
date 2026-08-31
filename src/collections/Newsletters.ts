import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '../lib/access'

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
        // CMS sending is intentionally DISABLED. The ONLY way to broadcast is by
        // emailing newsletters@reporters-desk.org from an authorised address
        // (abhishek.angad@ / newsletters@). Marking a newsletter 'Sent' here
        // records it but does NOT email anyone.
        req.payload.logger.warn(
          `[Newsletter] CMS send is disabled — '${doc.subject}' was NOT emailed. Broadcast by emailing newsletters@reporters-desk.org from an authorised address.`,
        )
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
