import type { CollectionConfig } from 'payload'

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  admin: {
    useAsTitle: 'email',
    group: 'Admin Console',
    defaultColumns: ['email', 'status', 'source', 'subscribedAt'],
    listSearchableFields: ['email', 'status'],
    description: 'Readers who have opted in to receive the newsletter.',
  },
  access: {
    // Only authenticated users (editors/admins) can read the list
    read: ({ req: { user } }) => Boolean(user),
    // Public endpoint (the subscribe route) creates via local API with elevated access
    create: () => true,
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'editor')),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'source',
      type: 'text',
      label: 'Subscription Source',
      admin: {
        description: 'The page path where the reader subscribed.',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
      defaultValue: 'active',
      required: true,
    },
    {
      name: 'subscribedAt',
      type: 'date',
      defaultValue: () => new Date(),
    },
  ],
}
