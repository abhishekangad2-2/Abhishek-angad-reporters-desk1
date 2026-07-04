import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '../lib/access'

export const Issues: CollectionConfig = {
  slug: 'issues',
  access: {
    read: () => true, // Public site taxonomy
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: isEditorOrAbove,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Newsroom',
    description: 'Optional running threads (e.g. "Climate") that group related stories together.',
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
