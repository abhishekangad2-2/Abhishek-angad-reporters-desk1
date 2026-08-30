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
    // Editors/admins see everything; the public reads only visible comments,
    // which the API route enforces with an explicit where-clause anyway.
    read: () => true,
    // The public comment endpoint creates via the local API (elevated access).
    create: () => true,
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
        { label: 'Visible', value: 'visible' },
        { label: 'Hidden', value: 'hidden' },
      ],
      defaultValue: 'visible',
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
