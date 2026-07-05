import type { GlobalConfig } from 'payload'

// Reject non-hex values in the CMS (empty is allowed — resolveDesign falls back
// to the preset). Prevents an editor silently getting Newsroom Classic because
// they typed "red" instead of "#b43d2a".
const hexValidate = (val: unknown): true | string => {
  if (val == null || val === '') return true
  if (typeof val === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val.trim())) return true
  return 'Enter a hex color like #b43d2a (3 or 6 digits), or leave blank.'
}

// Design Studio — the editor-facing "design your own landing page" panel.
// Everything here is read by landing.server.ts (getLandingDesign) and applied
// to whichever of the four landing layouts is active: palette recolors the
// whole page via CSS variables; the simulation block drives the WebGL
// background (kind, density, speed, colors, interactivity).
export const DesignStudio: GlobalConfig = {
  slug: 'design-studio',
  label: 'Design Studio',
  admin: {
    group: 'Appearance',
    description:
      'Design the landing page: color palette, background simulation, and motion. Changes apply to all four layouts instantly.',
  },
  access: {
    read: () => true, // resolved server-side for the public homepage
    update: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'editor')),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Layout',
          description: 'Which of the four landing layouts the homepage renders.',
          fields: [
            {
              name: 'layout',
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
                description: '?layout= still overrides for preview.',
                components: {
                  Field: '/components/admin/LandingLayoutPicker#LandingLayoutPicker',
                },
              },
            },
          ],
        },
        {
          label: 'Palette',
          fields: [
            {
              name: 'palettePreset',
              type: 'select',
              defaultValue: 'newsroom-classic',
              options: [
                { label: 'Newsroom Classic (ink on cool paper)', value: 'newsroom-classic' },
                { label: 'Midnight Wire (dark)', value: 'midnight-wire' },
                { label: 'Archive Sepia', value: 'archive-sepia' },
                { label: 'Forest Ledger', value: 'forest-ledger' },
                { label: 'High Alert', value: 'high-alert' },
                { label: 'Custom…', value: 'custom' },
              ],
              admin: {
                components: {
                  Field: '/components/admin/PalettePicker#PalettePicker',
                },
              },
            },
            {
              name: 'customPalette',
              type: 'group',
              label: 'Custom palette',
              admin: {
                condition: (data) => data?.palettePreset === 'custom',
                description: 'Hex colors, e.g. #b43d2a. Invalid values fall back to Newsroom Classic.',
              },
              fields: [
                { name: 'ink', type: 'text', label: 'Ink (text)', defaultValue: '#14171c', validate: hexValidate },
                { name: 'paper', type: 'text', label: 'Paper (background)', defaultValue: '#efeee8', validate: hexValidate },
                { name: 'accent', type: 'text', label: 'Accent', defaultValue: '#b43d2a', validate: hexValidate },
                { name: 'dataAccent', type: 'text', label: 'Data accent', defaultValue: '#3e6b66', validate: hexValidate },
              ],
            },
          ],
        },
        {
          label: 'Simulation',
          fields: [
            {
              name: 'simulation',
              type: 'group',
              label: false as unknown as string,
              admin: {
                description:
                  'The WebGL background for the Z-Axis, X/Y and Newspaper layouts. The Immersive layout uses its own evolving backdrop, so the simulation is not applied there.',
              },
              fields: [
                {
                  name: 'kind',
                  type: 'select',
                  defaultValue: 'plexus',
                  options: [
                    { label: 'Plexus network', value: 'plexus' },
                    { label: 'Particle drift', value: 'particles' },
                    { label: 'Flow waves', value: 'waves' },
                    { label: 'Constellation', value: 'constellation' },
                    { label: 'Off (still page)', value: 'off' },
                  ],
                  admin: {
                    components: {
                      Field: '/components/admin/SimulationPicker#SimulationPicker',
                    },
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'density',
                      type: 'number',
                      min: 20,
                      max: 200,
                      defaultValue: 90,
                      admin: { description: 'Node / particle count (20–200)', width: '33%' },
                    },
                    {
                      name: 'speed',
                      type: 'number',
                      min: 0.2,
                      max: 2,
                      defaultValue: 1,
                      admin: { description: 'Motion speed (0.2–2×)', width: '33%' },
                    },
                    {
                      name: 'intensity',
                      type: 'number',
                      min: 0.1,
                      max: 1,
                      defaultValue: 0.75,
                      admin: { description: 'Visual strength (0.1–1)', width: '33%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'primary',
                      type: 'text',
                      label: 'Primary color',
                      admin: { description: 'Hex; empty = palette accent', width: '50%' },
                    },
                    {
                      name: 'secondary',
                      type: 'text',
                      label: 'Secondary color',
                      admin: { description: 'Hex; empty = palette data accent', width: '50%' },
                    },
                  ],
                },
                {
                  name: 'interactive',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'React to hover / pointer',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
