import type { CollectionConfig } from 'payload'
import { isAdmin, isEditorOrAbove } from '../lib/access'

const CATEGORIES = [
  'Political Reporting',
  'Investigations',
  'Elections (ECI)',
  'Health',
  'Mob Violence',
  'Criminal Justice',
  'Climate',
  'Policy',
  'Profiles',
]

export const Archive: CollectionConfig = {
  slug: 'archive',
  labels: { singular: 'Archive Clip', plural: 'Archive' },
  access: {
    // Public read (the archive site is public); newsroom staff edit; admin deletes.
    read: () => true,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'outlet', 'year'],
    group: 'Archive',
    description:
      'Published clips shown at reportersdesk.abhishekangad.com. Edit body text here to clean any extraction residue.',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL: reportersdesk.abhishekangad.com/<slug>' },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: CATEGORIES.map((c) => ({ label: c, value: c })),
    },
    {
      name: 'outlet',
      type: 'select',
      defaultValue: 'The Indian Express',
      options: [
        { label: 'The Indian Express', value: 'The Indian Express' },
        { label: 'Hindustan Times', value: 'Hindustan Times' },
        { label: 'None (own work)', value: 'none' },
      ],
      admin: { description: 'Attribution shown on the article. "None" for unpublished/own work.' },
    },
    {
      name: 'outletInferred',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Outlet was auto-defaulted to Indian Express — verify and untick.' },
    },
    {
      name: 'publishDate',
      type: 'date',
      admin: { description: 'Exact publish date, if known.' },
    },
    {
      name: 'year',
      type: 'text',
      required: true,
      admin: { description: 'Year — used for display when the exact date is unknown.' },
    },
    {
      name: 'dateExact',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Tick when publishDate is the real, exact date.' },
    },
    { name: 'dek', type: 'textarea', admin: { description: 'Standfirst / summary line.' } },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      admin: { description: 'Article text. A blank line separates paragraphs.' },
    },
    {
      name: 'sourceFile',
      type: 'text',
      admin: { readOnly: true, description: 'Provenance — source PDF filename.' },
    },
  ],
}
