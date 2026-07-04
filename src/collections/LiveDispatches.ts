import type { CollectionConfig } from 'payload'
import { isEditorOrAbove, isReporterOrAbove } from '../lib/access'

export const LiveDispatches: CollectionConfig = {
  slug: 'live-dispatches',
  access: {
    // Public read (rendered site-wide in the floating widget). Only newsroom
    // staff can post/edit; deletion is editors-and-above.
    read: () => true,
    create: isReporterOrAbove,
    update: isReporterOrAbove,
    delete: isEditorOrAbove,
  },
  admin: {
    useAsTitle: 'headline',
    group: 'Engagement',
    description: 'Short-form live updates that appear in the floating widget across the site.',
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
      name: 'significance',
      type: 'select',
      defaultValue: 'normal',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Significant', value: 'significant' },
        { label: 'Breaking', value: 'breaking' },
      ],
      admin: {
        description:
          'Significant / Breaking dispatches get a Plexus-Pulse ripple + flag label in the floating widget.',
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
