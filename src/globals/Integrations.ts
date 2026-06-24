import type { GlobalConfig } from 'payload'

export const Integrations: GlobalConfig = {
  slug: 'integrations',
  label: 'Integrations Tab',
  access: {
    read: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
    update: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Analytics (GA4)',
          description: 'GA4 dashboard pull and tracking configuration.',
          fields: [
            { name: 'ga4MeasurementId', type: 'text', label: 'Measurement ID (G-XXXXXXXXXX)' },
            { name: 'ga4PropertyId', type: 'text', label: 'Property ID (for Data API)' },
          ],
        },
        {
          label: 'Video API (Mux/Stream)',
          description: 'Video API management.',
          fields: [
            { name: 'muxTokenId', type: 'text', label: 'Mux Token ID' },
            { name: 'muxTokenSecret', type: 'text', label: 'Mux Token Secret' },
            { name: 'cloudflareStreamId', type: 'text', label: 'Cloudflare Stream ID' },
          ],
        },
        {
          label: 'Translation Tool',
          description: 'Google Cloud Translation API credentials.',
          fields: [
            { name: 'googleCloudTranslationApiKey', type: 'text', label: 'API Key' },
          ],
        },
      ],
    },
  ],
}
