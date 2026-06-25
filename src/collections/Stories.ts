import type { Block, CollectionConfig } from 'payload'
import { generateReadDeeperHook } from '../hooks/generateReadDeeper'
import { LayoutPicker } from '../components/admin/LayoutPicker'
import { AccentThemePicker } from '../components/admin/AccentThemePicker'
import { PublishGateChecklist } from '../components/admin/PublishGateChecklist'

const SinglePictureBlock: Block = {
  slug: 'SinglePicture',
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
}

const TextPhotoBlock: Block = {
  slug: 'TextPhoto',
  fields: [
    {
      name: 'text',
      type: 'textarea',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
}

const GalleryAudioVideoBlock: Block = {
  slug: 'GalleryAudioVideo',
  fields: [
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
      required: true,
    },
    {
      name: 'track',
      type: 'upload',
      relationTo: 'media',
      label: 'Audio or Video Track',
    },
  ],
}

export const Stories: CollectionConfig = {
  slug: 'stories',
  admin: {
    useAsTitle: 'headline',
    components: {
      BeforeDocumentControls: [PublishGateChecklist],
    },
  },
  access: {
    read: () => true, // Public can read
    create: ({ req: { user } }) => Boolean(user), // Any authenticated user can create
    update: ({ req: { user } }) => Boolean(user), // Field-level access controls the status
    delete: ({ req: { user } }) => {
      // Only admins and editors can delete
      if (!user) return false
      return user.role === 'admin' || user.role === 'editor'
    },
  },
  versions: {
    maxPerDoc: 50, // Revision history
  },
  hooks: {
    beforeChange: [
      generateReadDeeperHook,
      ({ data, req, operation }) => {
        if (data.status === 'published' && (data.section === 'accountability' || data.section === 'investigative')) {
          if (!data.editorialReview?.factChecked || !data.editorialReview?.legallyReviewed) {
            throw new Error('Accountability and Investigative stories must be fact-checked and legally reviewed before publishing.')
          }
        }
        return data
      }
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Story Editor',
          fields: [
            {
              name: 'headline',
              type: 'text',
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'strap',
              type: 'text',
            },
            {
              name: 'caption',
              type: 'text',
              label: 'Hero Caption',
            },
            {
              name: 'heroMedia',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'layout',
              type: 'blocks',
              required: true,
              blocks: [
                {
                  slug: 'Prose',
                  fields: [{ name: 'content', type: 'richText', required: true }]
                },
                SinglePictureBlock,
                TextPhotoBlock,
                GalleryAudioVideoBlock,
              ],
            },
            {
              name: 'section',
              type: 'relationship',
              relationTo: 'sections',
              required: true,
              admin: {
                description: 'Editorial desk this story belongs to',
              },
            },
            {
              name: 'issueTags',
              type: 'relationship',
              relationTo: 'issues',
              hasMany: true,
              admin: {
                description: 'Topics/issues covered in this story',
              },
            },
            {
              name: 'accentTheme',
              type: 'select',
              options: [
                { label: 'Inherit from desk', value: 'inherit' },
                { label: 'House red', value: 'house-red' },
                { label: 'Field teal', value: 'field-teal' },
                { label: 'Ink', value: 'ink' },
                { label: 'Archive sepia', value: 'archive-sepia' },
                { label: 'Forest', value: 'forest' },
                { label: 'Slate', value: 'slate' },
              ],
              defaultValue: 'inherit',
              admin: {
                description: 'Override the desk\'s default accent color (optional)',
                components: {
                  Field: AccentThemePicker,
                },
              },
            },
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
              required: true,
            },
            {
              name: 'editorialReview',
              type: 'group',
              admin: {
                position: 'sidebar',
              },
              fields: [
                {
                  name: 'factChecked',
                  type: 'checkbox',
                  label: 'Fact-Checked',
                  defaultValue: false,
                },
                {
                  name: 'legallyReviewed',
                  type: 'checkbox',
                  label: 'Legally Reviewed',
                  defaultValue: false,
                },
              ],
            },
            {
              name: 'readDeeper',
              type: 'group',
              label: '🤖 Read Deeper AI Engine',
              admin: {
                description: 'Use Gemini AI to suggest tags based on the article content.',
              },
              fields: [
                {
                  name: 'generateTags',
                  type: 'checkbox',
                  label: 'Generate Tags on Save',
                  admin: {
                    description: 'Check this box and save the article to auto-generate suggested tags and reasoning.',
                  },
                },
                {
                  name: 'suggestedTags',
                  type: 'select',
                  hasMany: true,
                  options: [
                    { label: 'Corruption', value: 'corruption' },
                    { label: 'Environment', value: 'environment' },
                    { label: 'Healthcare', value: 'healthcare' },
                    { label: 'Politics', value: 'politics' },
                    { label: 'Law', value: 'law' },
                    { label: 'Economy', value: 'economy' }
                  ],
                  admin: {
                    readOnly: false,
                  },
                },
                {
                  name: 'reasoning',
                  type: 'textarea',
                  admin: {
                    readOnly: false,
                  },
                },
              ],
            },
            {
              name: 'layout_type',
              type: 'select',
              options: [
                { label: 'Template 1 (Three-Column Bleed)', value: 'template_1' },
                { label: 'Template 2 (Z-Pattern Scroll)', value: 'template_2' },
                { label: 'Template 3 (Newspaper Grid)', value: 'template_3' },
                { label: 'Template 4 (Immersive Scrollytelling)', value: 'template_4' },
              ],
              required: true,
              defaultValue: 'template_1',
              admin: {
                components: {
                  Field: LayoutPicker,
                },
              },
            },
            {
              name: 'scrollytellingChapters',
              type: 'array',
              label: 'Scrollytelling Chapters (Template 4 Only)',
              admin: {
                condition: (data) => data.layout_type === 'template_4',
                description: 'Build your immersive narrative chapter by chapter. Each chapter triggers sequentially as the user scrolls.',
              },
              fields: [
                {
                  name: 'chapterTitle',
                  type: 'text',
                },
                {
                  name: 'content',
                  type: 'richText',
                  required: true,
                },
                {
                  name: 'alignment',
                  type: 'select',
                  options: [
                    { label: 'Left', value: 'left' },
                    { label: 'Center', value: 'center' },
                    { label: 'Right', value: 'right' },
                  ],
                  defaultValue: 'center',
                },
                {
                  name: 'backgroundMedia',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Optional background image or video that fades in for this chapter.',
                  },
                },
                {
                  name: 'ambientAudio',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Optional audio track that crossfades in for this chapter.',
                  },
                },
              ],
            },
            {
              name: 'corrections',
              type: 'array',
              label: 'Corrections Log',
              admin: {
                description: 'Record any factual corrections. These will be displayed publicly on the article to maintain accountability.',
              },
              fields: [
                {
                  name: 'correctionText',
                  type: 'textarea',
                  required: true,
                },
                {
                  name: 'correctedAt',
                  type: 'date',
                  required: true,
                  defaultValue: () => new Date(),
                },
                {
                  name: 'showBanner',
                  type: 'checkbox',
                  label: 'Show Public Banner',
                  defaultValue: true,
                },
              ],
            },
          ]
        },
        {
          label: 'Visual Media Studio',
          description: 'For Visual & Audio Investigations: Specialized media blocks.',
          fields: [
            {
              name: 'visualMedia',
              type: 'blocks',
              blocks: [SinglePictureBlock, TextPhotoBlock, GalleryAudioVideoBlock],
            },
          ]
        }
      ]
    },
    // Sidebar fields
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'in-review' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      required: true,
      admin: {
        position: 'sidebar',
      },
      access: {
        update: ({ req: { user }, data }) => {
          if (!user) return false
          // Admins and Editors can change to any status
          if (user.role === 'admin' || user.role === 'editor') return true
          
          // Reporters and Contributors can only transition to 'draft' or 'in-review'
          if (data?.status === 'scheduled' || data?.status === 'published' || data?.status === 'archived') {
            return false
          }
          return true
        },
      },
    },
    {
      name: 'scheduledAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'seoMeta',
      type: 'group',
      admin: {
        position: 'sidebar',
      },
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'keywords', type: 'text' },
      ],
    },
  ],
}
