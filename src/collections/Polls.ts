import type { CollectionConfig } from 'payload'

export const Polls: CollectionConfig = {
  slug: 'polls',
  admin: {
    useAsTitle: 'question',
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'options',
      type: 'array',
      minRows: 2,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
        {
          name: 'votes',
          type: 'number',
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'openWindow',
      type: 'date',
      admin: {
        description: 'When the poll should open for voting.',
      },
    },
    {
      name: 'closeWindow',
      type: 'date',
      admin: {
        description: 'When the poll should close for voting.',
      },
    },
  ],
}
