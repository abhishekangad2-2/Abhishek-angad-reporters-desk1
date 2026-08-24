import type { CollectionConfig } from 'payload'
import { isAdmin, isEditorOrAbove } from '../lib/access'

// Turn any text into a URL-safe slug (shared shape with the Stories slug hook).
function slugify(source: string): string {
  return source
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/g, '')
}

export const Podcasts: CollectionConfig = {
  slug: 'podcasts',
  labels: { singular: 'Podcast Episode', plural: 'Podcasts' },
  access: {
    // Public sees only published episodes; newsroom staff see all; admin deletes.
    read: (args) => (isEditorOrAbove(args) ? true : { status: { equals: 'published' } }),
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'episodeNumber', 'status', 'publishDate'],
    group: 'Multimedia',
    description: 'Audio episodes shown at /podcast. Upload the audio file, add show notes, publish.',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL: /podcast/<slug>. Auto-generated from the title if left blank.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            const source = value && String(value).trim() ? String(value) : String(data?.title ?? '')
            return slugify(source) || value
          },
        ],
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'audio',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'The episode audio file (mp3/m4a/wav).' },
    },
    {
      name: 'coverArt',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional square episode artwork.' },
    },
    {
      name: 'episodeNumber',
      type: 'number',
      admin: { position: 'sidebar', description: 'Optional episode number.' },
    },
    {
      name: 'publishDate',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'duration', type: 'text', admin: { description: 'e.g. 42:10 (optional).' } },
    { name: 'guests', type: 'text', admin: { description: 'Featured guests, comma-separated (optional).' } },
    { name: 'dek', type: 'textarea', label: 'Short summary', admin: { description: 'One or two lines shown in the episode list.' } },
    { name: 'showNotes', type: 'richText', admin: { description: 'Full show notes, links, chapters.' } },
    { name: 'transcript', type: 'textarea', admin: { description: 'Optional transcript.' } },
    {
      // Pre-computed waveform peaks (normalised 0–1). Lets the player render the
      // waveform instantly and stream the audio instead of downloading it all.
      name: 'peaks',
      type: 'json',
      admin: { hidden: true },
    },
  ],
}
