export interface Section {
  id: string
  slug: string
  name: string
  description: string
}

export const SECTIONS: Section[] = [
  { id: 'accountability', slug: 'accountability', name: 'Accountability', description: 'Power tracking, public records auditing, and institutional oversight.' },
  { id: 'investigative', slug: 'investigative', name: 'Investigative', description: 'Deep-dive reports on systemic corruption, financial crime, and human rights.' },
  { id: 'feature', slug: 'feature', name: 'Feature', description: 'Long-form narrative journalism exploring human stories behind the headlines.' },
  { id: 'news', slug: 'news', name: 'News', description: 'Urgent, fact-checked dispatches from the front lines of current events.' },
  { id: 'opinion', slug: 'opinion', name: 'Opinion', description: 'Analytical perspective, critique, and commentary from senior correspondents.' }
]
