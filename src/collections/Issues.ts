import type { CollectionConfig } from 'payload'

export const Issues: CollectionConfig = {
  slug: 'issues',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'cluster',
      type: 'text',
      admin: {
        description: 'Optional grouping for related issues (e.g., "Climate")',
      },
    },
  ],
}
