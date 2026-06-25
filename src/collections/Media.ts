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
        if (operation !== 'create' || !doc.mimeType) return

        // Video → kick off a Google Cloud Transcoder job that produces an HLS
        // rendition + manifest into gs://<bucket>/transcoded/<id>/. Auth is the
        // Cloud Run service account (ADC); the job runs in the secret-walker
        // project (GCS_PROJECT_ID). Failures are logged, never block the upload.
        if (doc.mimeType.startsWith('video/')) {
          const bucket = process.env.GCS_BUCKET_NAME
          const project = process.env.GCS_PROJECT_ID
          const location = process.env.TRANSCODER_LOCATION || 'us-central1'
          if (!bucket || !project) return
          try {
            const { TranscoderServiceClient } = await import('@google-cloud/video-transcoder')
            const client = new TranscoderServiceClient()
            await client.createJob({
              parent: client.locationPath(project, location),
              job: {
                inputUri: `gs://${bucket}/${doc.filename}`,
                outputUri: `gs://${bucket}/transcoded/${doc.id}/`,
                config: {
                  elementaryStreams: [
                    { key: 'video0', videoStream: { h264: { heightPixels: 720, widthPixels: 1280, bitrateBps: 2_500_000, frameRate: 30 } } },
                    { key: 'audio0', audioStream: { codec: 'aac', bitrateBps: 64_000 } },
                  ],
                  muxStreams: [
                    { key: 'hd', container: 'ts', elementaryStreams: ['video0', 'audio0'] },
                  ],
                  manifests: [
                    { fileName: 'manifest.m3u8', type: 'HLS', muxStreams: ['hd'] },
                  ],
                },
              },
            })
            req.payload.logger.info(`[Transcoder] HLS job created for media ${doc.id} (${doc.filename})`)
          } catch (err) {
            req.payload.logger.error('[Transcoder] failed to create job: ' + err)
          }
        }

        // Audio → Speech-to-Text transcription is a later phase (the
        // transcript / transcriptionStatus fields already exist for it).
      },
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
