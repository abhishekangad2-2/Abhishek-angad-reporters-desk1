import type { CollectionConfig } from 'payload'

export const Newsletters: CollectionConfig = {
  slug: 'newsletters',
  admin: {
    useAsTitle: 'subject',
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        // If status changed to 'sent', trigger Resend API
        if (operation === 'update' && doc.status === 'sent' && previousDoc.status !== 'sent') {
          if (process.env.RESEND_API_KEY) {
            console.log(`[Newsletter Hook] Dispatching newsletter "${doc.subject}" via Resend...`);
            // In a real implementation:
            // 1. Fetch all subscribed users.
            // 2. Render the Lexical content to HTML.
            // 3. Batch send via Resend SDK.
          } else {
             console.log(`[Newsletter Hook] Cannot dispatch "${doc.subject}", RESEND_API_KEY is missing.`);
          }
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
