import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '../lib/access'

export const Polls: CollectionConfig = {
  slug: 'polls',
  access: {
    // Public can read polls (rendered on the site). Vote counts update via the
    // dedicated /api/polls/[id]/vote route (Local API, bypasses access).
    // Direct REST writes are editors-and-above only.
    read: () => true,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: isEditorOrAbove,
  },
  admin: {
    useAsTitle: 'question',
    group: 'Engagement',
    defaultColumns: ['question', 'active', 'opensAt', 'closesAt'],
    listSearchableFields: ['question'],
    description: 'Reader polls — open/close windows, live vote counts on each option.',
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
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'voteCount',
          type: 'number',
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'resultsVisible',
      type: 'select',
      options: [
        { label: 'Live (readers see results immediately)', value: 'live' },
        { label: 'After Close', value: 'after-close' },
      ],
      defaultValue: 'after-close',
      required: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'opensAt',
      type: 'date',
      admin: {
        description: 'When the poll should open for voting.',
      },
    },
    {
      name: 'closesAt',
      type: 'date',
      admin: {
        description: 'When the poll should close for voting.',
      },
    },
  ],
}

