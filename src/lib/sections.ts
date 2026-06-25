// TRANSITIONAL: This file is kept for backwards compatibility with hardcoded routing.
// In P2, fetch sections dynamically from the Payload API instead of this static array.
// Synced with the Sections collection seed data.

export interface Section {
  id?: string // Payload document ID (added when fetched from API)
  slug: string // URL routing  (/[section]/...)
  name: string
  description: string
}

export const SECTIONS: Section[] = [
  {
    slug: 'accountability',
    name: 'Accountability Journalism',
    description: 'Holding power to account through investigative reporting and data analysis',
  },
  {
    slug: 'ground-reportage',
    name: 'Ground Reportage',
    description: 'On-the-ground reporting from underreported regions and communities',
  },
  {
    slug: 'data-journalism',
    name: 'Data Journalism',
    description: 'Investigative stories driven by data analysis and visualization',
  },
  {
    slug: 'investigative',
    name: 'Investigative Journalism',
    description: 'Deep dives into systemic issues and institutional failures',
  },
  {
    slug: 'analysis',
    name: 'Analysis',
    description: 'Expert perspective on current events and long-term trends',
  },
  {
    slug: 'behind-the-process',
    name: 'Behind the Process',
    description: 'How we do our work: methodology, data sources, and editorial decisions',
  },
  {
    slug: 'visual-audio',
    name: 'Visual and Audio Investigations',
    description: 'Stories told through photography, video, and sound',
  },
  {
    slug: 'policy-people',
    name: 'Policy and People',
    description: 'How policy decisions impact lives on the ground',
  },
]
