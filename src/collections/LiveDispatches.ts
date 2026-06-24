import type { CollectionConfig } from 'payload'

export const LiveDispatches: CollectionConfig = {
  slug: 'live-dispatches',
  admin: {
    useAsTitle: 'headline',
    description: 'Short-form live updates and dispatches.',
  },
  fields: [
    {
      name: 'headline',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
    {
      name: 'initials',
      type: 'text',
      maxLength: 4,
      admin: {
        description: "Filing journalist's initials",
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'Time when this dispatch should expire and be removed from the floating widget.',
      },
    },
  ],
}
