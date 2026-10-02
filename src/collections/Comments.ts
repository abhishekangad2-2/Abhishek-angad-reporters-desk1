import type { CollectionConfig } from 'payload'

// Reader comments on stories. Auto-published (status defaults to 'visible'), so
// they appear immediately — the public API guards against spam with a honeypot
// + rate limit. Editors can flip a comment to 'hidden' in the CMS to remove it
// after the fact. Public reads are restricted to visible comments only.
export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'author',
    group: 'Tools',
    defaultColumns: ['author', 'storySlug', 'status', 'createdAt'],
    listSearchableFields: ['author', 'body', 'storySlug'],
    description: 'Reader comments left on stories.',
  },
  access: {
    // Staff see everything; the PUBLIC may only read 'visible' comments. This
    // must be enforced here, not just in the custom /api/comments route —
    // Payload's REST API (/api/comments/<id>) is public and would otherwise
    // expose unmoderated 'pending'/'hidden' comments by id.
    read: ({ req: { user } }) => (user ? true : { status: { equals: 'visible' } }),
    // Reader comments are created only through the /api/comments route (Local
    // API, overrideAccess). Block anonymous REST creates so the honeypot +
    // rate-limit + forced 'pending' status can't be bypassed.
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'editor')),
  },
  fields: [
    {
      name: 'author',
      type: 'text',
      required: true,
      maxLength: 80,
      label: 'Display name',
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      maxLength: 4000,
    },
    {
      name: 'story',
      type: 'relationship',
      relationTo: 'stories',
      required: true,
      index: true,
    },
    {
      name: 'storySlug',
      type: 'text',
      index: true,
      admin: { description: 'Denormalised story slug, for quick public lookups.' },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        // New reader comments land as 'pending' and are invisible to the public
        // until an editor approves them to 'visible'. 'hidden' un-publishes one.
        { label: 'Pending review', value: 'pending' },
        { label: 'Visible', value: 'visible' },
        { label: 'Hidden', value: 'hidden' },
      ],
      defaultValue: 'pending',
      required: true,
      index: true,
    },
    {
      name: 'createdAt',
      type: 'date',
      defaultValue: () => new Date(),
    },
  ],
}
