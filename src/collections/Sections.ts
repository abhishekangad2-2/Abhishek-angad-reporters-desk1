import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '../lib/access'

export const Sections: CollectionConfig = {
  slug: 'sections',
  access: {
    read: () => true, // Public site taxonomy
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: isEditorOrAbove,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Newsroom',
    description: 'Editorial desks (e.g. Accountability, Ground Reportage) that stories belong to.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-safe identifier (e.g., "accountability-journalism")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Editorial mission for this desk',
      },
    },
    {
      name: 'defaultAccent',
      type: 'select',
      options: [
        { label: 'House red', value: 'house-red' },
        { label: 'Field teal', value: 'field-teal' },
        { label: 'Ink', value: 'ink' },
        { label: 'Archive sepia', value: 'archive-sepia' },
        { label: 'Forest', value: 'forest' },
        { label: 'Slate', value: 'slate' },
      ],
      defaultValue: 'house-red',
      admin: {
        description: 'Default accent color for stories in this desk',
      },
    },
    {
      name: 'defaultLayout',
      type: 'select',
      options: [
        { label: 'Three-column', value: 'template_1' },
        { label: 'Z-pattern', value: 'template_2' },
        { label: 'Newspaper grid', value: 'template_3' },
        { label: 'Immersive scrollytelling', value: 'template_4' },
      ],
      defaultValue: 'template_3',
      admin: {
        description: 'Default layout template for stories in this desk',
      },
    },
  ],
}
