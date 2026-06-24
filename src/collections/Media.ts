import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'audio/*', 'video/*'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // Trigger Whisper transcription if audio/video and it doesn't have a transcript yet
        if (operation === 'create' && doc.mimeType && (doc.mimeType.startsWith('audio/') || doc.mimeType.startsWith('video/'))) {
          if (!doc.transcript) {
            // In a real implementation, you would dispatch a background job here
            // to fetch the file from S3 and send it to OpenAI, then update the doc.
            // For now, we simulate the hook firing.
            console.log(`[Media Hook] Audio/Video uploaded: ${doc.filename}. Dispatching transcription job...`);
          }
        }
      }
    ]
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
    },
    {
      name: 'credit',
      type: 'text',
      required: true,
      admin: {
        description: 'The photographer or creator of the media.',
      },
    },
    {
      name: 'source',
      type: 'text',
      required: true,
      admin: {
        description: 'Where this media was obtained (e.g., AP, Getty, Leaked Document, Original).',
      },
    },
    {
      name: 'licenseType',
      type: 'select',
      required: true,
      options: [
        { label: 'Public Domain', value: 'public_domain' },
        { label: 'Creative Commons', value: 'creative_commons' },
        { label: 'Licensed/Purchased', value: 'licensed' },
        { label: 'Fair Use', value: 'fair_use' },
        { label: 'Original Content (Owned)', value: 'original' },
      ],
    },
    {
      name: 'expiryDate',
      type: 'date',
      admin: {
        description: 'If licensed for a specific period, when does the license expire?',
      },
    },
    {
      name: 'transcript',
      type: 'textarea',
      admin: {
        description: 'Auto-generated transcript via Whisper (for audio/video).',
      },
    },
    {
      name: 'transcriptionStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: {
        position: 'sidebar',
      }
    }
  ],
}
