export interface Section {
  id: string   // must exactly match the `section` select value in Stories collection
  slug: string // used in URL routing  (/[section]/...)
  name: string
  description: string
}

export const SECTIONS: Section[] = [
  {
    id: 'accountability',
    slug: 'accountability',
    name: 'Accountability',
    description: 'Power tracking, public records auditing, and institutional oversight.',
  },
  {
    id: 'investigative',
    slug: 'investigative',
    name: 'Investigative',
    description: 'Deep-dive reports on systemic corruption, financial crime, and human rights.',
  },
  {
    id: 'data_journalism',
    slug: 'data-journalism',
    name: 'Data Journalism',
    description: 'Datasets, charts, and quantitative reporting that reveal hidden patterns.',
  },
  {
    id: 'interviews',
    slug: 'interviews',
    name: 'Interviews',
    description: 'Long-form conversations with key figures shaping public life.',
  },
  {
    id: 'explainers',
    slug: 'explainers',
    name: 'Explainers',
    description: 'Clear, evidence-based guides to complex policy and events.',
  },
  {
    id: 'visual',
    slug: 'visual',
    name: 'Visual',
    description: 'Photo essays, documentary photography, and visual investigations.',
  },
  {
    id: 'audio',
    slug: 'audio',
    name: 'Audio',
    description: 'Podcast dispatches, recorded testimonies, and audio documentaries.',
  },
  {
    id: 'dispatches',
    slug: 'dispatches',
    name: 'Dispatches',
    description: 'Short, urgent field reports from correspondents on the ground.',
  },
]
