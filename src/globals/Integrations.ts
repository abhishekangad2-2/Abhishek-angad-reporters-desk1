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
          label: 'Appearance',
          description: 'Choose the HRIE layout the public homepage renders.',
          fields: [
            {
              name: 'landingLayout',
              type: 'select',
              label: 'Homepage layout',
              defaultValue: 'three-column',
              options: [
                { label: 'Z-Axis · three-column', value: 'three-column' },
                { label: 'X/Y · z-pattern rows', value: 'z-pattern' },
                { label: 'Newspaper', value: 'newspaper' },
                { label: 'Immersive (single feature)', value: 'immersive' },
              ],
              admin: {
                description: 'Set by the Layout Co-Pilot. ?layout= still overrides for preview.',
                components: {
                  Field: '/components/admin/LandingLayoutPicker#LandingLayoutPicker',
                },
              },
            },
          ],
        },
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
