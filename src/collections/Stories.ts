import type { Block, CollectionConfig } from 'payload'
import { generateReadDeeperHook } from '../hooks/generateReadDeeper'
import { LayoutPicker } from '../components/admin/LayoutPicker'
import { AccentThemePicker } from '../components/admin/AccentThemePicker'
import { PublishGateChecklist } from '../components/admin/PublishGateChecklist'
import { isEditorOrAbove, isReporterOrAbove, roleOf } from '../lib/access'

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

const FullBleedImageBlock: Block = {
  slug: 'FullBleedImage',
  labels: { singular: 'Full-bleed image', plural: 'Full-bleed images' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'overlayText', type: 'text', label: 'Overlay headline (optional)' },
    { name: 'credit', type: 'text' },
  ],
}

const ImageComparisonBlock: Block = {
  slug: 'ImageComparison',
  labels: { singular: 'Before / after', plural: 'Before / after' },
  fields: [
    { name: 'beforeImage', type: 'upload', relationTo: 'media', required: true },
    { name: 'afterImage', type: 'upload', relationTo: 'media', required: true },
    { name: 'beforeLabel', type: 'text', defaultValue: 'Before' },
    { name: 'afterLabel', type: 'text', defaultValue: 'After' },
    { name: 'caption', type: 'text' },
  ],
}

const PullQuoteBlock: Block = {
  slug: 'PullQuote',
  labels: { singular: 'Pull quote', plural: 'Pull quotes' },
  fields: [
    { name: 'quote', type: 'textarea', required: true },
    { name: 'attribution', type: 'text' },
  ],
}

const DiptychBlock: Block = {
  slug: 'Diptych',
  labels: { singular: 'Two-up images', plural: 'Two-up images' },
  fields: [
    { name: 'leftImage', type: 'upload', relationTo: 'media', required: true },
    { name: 'leftCaption', type: 'text' },
    { name: 'rightImage', type: 'upload', relationTo: 'media', required: true },
    { name: 'rightCaption', type: 'text' },
  ],
}

const VideoEmbedBlock: Block = {
  slug: 'VideoEmbed',
  labels: { singular: 'Video', plural: 'Videos' },
  fields: [
    { name: 'videoFile', type: 'upload', relationTo: 'media', label: 'Uploaded video (served as HLS)' },
    { name: 'embedUrl', type: 'text', label: 'or external URL (YouTube / Vimeo)' },
    { name: 'caption', type: 'text' },
  ],
}

const AudioClipBlock: Block = {
  slug: 'AudioClip',
  labels: { singular: 'Audio clip', plural: 'Audio clips' },
  fields: [
    { name: 'audioFile', type: 'upload', relationTo: 'media', required: true },
    { name: 'title', type: 'text' },
    { name: 'caption', type: 'text' },
  ],
}

const StatHighlightBlock: Block = {
  slug: 'StatHighlight',
  labels: { singular: 'Stat highlight', plural: 'Stat highlights' },
  fields: [
    { name: 'intro', type: 'text' },
    {
      name: 'stats',
      type: 'array',
      required: true,
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
      ],
    },
  ],
}

const RedactedDocumentBlock: Block = {
  slug: 'RedactedDocument',
  labels: { singular: 'Source document', plural: 'Source documents' },
  fields: [
    { name: 'documentImage', type: 'upload', relationTo: 'media', required: true },
    { name: 'sourceLabel', type: 'text', defaultValue: 'Source document' },
    { name: 'caption', type: 'text' },
  ],
}

const TimelineBlock: Block = {
  slug: 'Timeline',
  labels: { singular: 'Timeline', plural: 'Timelines' },
  fields: [
    {
      name: 'entries',
      type: 'array',
      required: true,
      fields: [
        { name: 'date', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'detail', type: 'textarea' },
      ],
    },
  ],
}

// Full Visual Media toolkit — 12 formats, all backed by prod DB tables.
// Migration 0001_visual_media_blocks.sql applied 2026-06-27.
const VISUAL_MEDIA_BLOCKS: Block[] = [
  SinglePictureBlock,
  TextPhotoBlock,
  GalleryAudioVideoBlock,
  FullBleedImageBlock,
  ImageComparisonBlock,
  PullQuoteBlock,
  DiptychBlock,
  VideoEmbedBlock,
  AudioClipBlock,
  StatHighlightBlock,
  RedactedDocumentBlock,
  TimelineBlock,
]

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
    create: isReporterOrAbove,
    update: ({ req }) => Boolean(req.user), // Field/beforeChange enforces what they can change
    delete: isEditorOrAbove,
  },
  versions: {
    maxPerDoc: 50, // Revision history
  },
  hooks: {
    beforeChange: [
      generateReadDeeperHook,
      // Role-aware workflow guard. Editor+ may publish/schedule/archive; lower
      // roles are capped at draft/in-review. Contributors can only ever set
      // status=draft (they can't move their own piece into review).
      async ({ data, req, operation, originalDoc }) => {
        const role = roleOf(req)
        if (!role || role === 'admin' || role === 'editor') return data
        const blocked = ['published', 'scheduled', 'archived']
        const next = data?.status as string | undefined
        if (next && blocked.includes(next)) {
          throw new Error(`Only editors and admins can move a story to "${next}".`)
        }
        if (role === 'contributor') {
          if (next && next !== 'draft') {
            throw new Error('Contributors can only save stories as drafts.')
          }
          // Contributors can't edit other authors' drafts.
          if (operation === 'update' && originalDoc) {
            const authors: any[] = (originalDoc as any).author || []
            const ownsIt = authors.some((a: any) => {
              const id = typeof a === 'object' && a !== null ? a.id : a
              return id === req.user?.id
            })
            if (!ownsIt) throw new Error('Contributors can only edit their own drafts.')
          }
        }
        return data
      },
      async ({ data, req }) => {
        // `section` is a relationship, so data.section is an id (or, if passed
        // populated, an object) — not the slug. Resolve the slug before gating,
        // otherwise the comparison never matches and the gate silently passes.
        if (data.status === 'published' && data.section) {
          let sectionSlug: string | undefined
          if (typeof data.section === 'object') {
            sectionSlug = (data.section as any).slug
          } else {
            try {
              const sec = await req.payload.findByID({ collection: 'sections', id: data.section, depth: 0 })
              sectionSlug = (sec as any)?.slug
            } catch {
              /* if we can't resolve it, fall through (don't block on lookup failure) */
            }
          }
          // Match the seeded section slugs (derived from the desk names).
          if (sectionSlug === 'accountability-journalism' || sectionSlug === 'investigative-journalism') {
            if (!data.editorialReview?.factChecked || !data.editorialReview?.legallyReviewed) {
              throw new Error('Accountability and Investigative stories must be fact-checked and legally reviewed before publishing.')
            }
          }
        }
        return data
      }
    ],
    afterChange: [
      // Workflow audit: log every status transition (Draft→Review→Scheduled→
      // Published→Archived) to the audit-logs collection. Failures are
      // swallowed so a logging hiccup never blocks the editorial action.
      async ({ doc, previousDoc, req, operation }) => {
        try {
          const prev = (previousDoc as any)?.status
          const next = (doc as any)?.status
          if (operation !== 'create' && prev === next) return
          await req.payload.create({
            collection: 'audit-logs',
            data: {
              action: operation === 'create' ? `story.create:${next}` : `story.status:${prev}→${next}`,
              collectionName: 'stories',
              documentId: String(doc.id),
              user: req.user?.id,
              details: { headline: (doc as any).headline, from: prev, to: next },
            },
          })
        } catch {
          /* never block editorial actions on audit log failure */
        }
      },
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
                ...VISUAL_MEDIA_BLOCKS,
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
          description: 'For Visual & Audio Investigations: 12 specialized media formats.',
          fields: [
            {
              name: 'visualMedia',
              type: 'blocks',
              blocks: VISUAL_MEDIA_BLOCKS,
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
