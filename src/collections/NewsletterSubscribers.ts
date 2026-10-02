import type { CollectionConfig } from 'payload'

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  admin: {
    useAsTitle: 'email',
    group: 'Tools',
    defaultColumns: ['email', 'status', 'source', 'subscribedAt'],
    listSearchableFields: ['email', 'status'],
    description: 'Readers who have opted in to receive the newsletter.',
  },
  access: {
    // Only authenticated users (editors/admins) can read the list
    read: ({ req: { user } }) => Boolean(user),
    // Sign-ups come only through /api/newsletter/subscribe (Local API,
    // overrideAccess) which rate-limits + validates. Block anonymous REST
    // creates so the subscriber list can't be flooded with arbitrary emails
    // (which the newsletter would then broadcast to).
    create: ({ req: { user } }) => Boolean(user),
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
