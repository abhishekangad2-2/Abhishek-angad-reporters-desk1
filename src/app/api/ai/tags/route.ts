import { NextResponse } from 'next/server'

// NLP-lite tag suggestions. Scores the article text against the predefined
// ReportersDesk tag vocabulary by keyword/synonym overlap — no external API
// key required. (Swap the scorer for a cloud NLP/spaCy call later; the response
// shape stays the same.) POST { text } -> { suggestions: string[] }.
export const dynamic = 'force-dynamic'

const TAGS: Record<string, string[]> = {
  'climate change': ['climate', 'warming', 'emission', 'carbon', 'heat', 'flood', 'drought'],
  'criminal justice system': ['police', 'court', 'jail', 'prison', 'arrest', 'bail', 'fir'],
  'food and farmers and politics': ['farmer', 'crop', 'msp', 'mandi', 'harvest', 'agriculture'],
  'follow the money': ['fund', 'budget', 'spend', 'contract', 'tender', 'crore', 'lakh', 'money'],
  'where was your money spent': ['scheme', 'allocation', 'utilisation', 'expenditure', 'budget'],
  'politics and politicians': ['minister', 'mla', 'mp', 'party', 'cm', 'government', 'leader'],
  'policy implementation': ['scheme', 'policy', 'rollout', 'implement', 'guideline', 'order'],
  'national politics': ['parliament', 'centre', 'union', 'lok sabha', 'national'],
  'state politics': ['assembly', 'state', 'cabinet', 'governor', 'soren', 'jharkhand'],
  'local-level politics': ['panchayat', 'block', 'district', 'ward', 'gram', 'municipal'],
  'legislature and laws': ['act', 'bill', 'law', 'amendment', 'legislation', 'rule'],
  'renewables': ['solar', 'wind', 'renewable', 'clean energy'],
  'urban and rural': ['village', 'rural', 'urban', 'city', 'town', 'basti'],
  'the minority question': ['minority', 'communal', 'muslim', 'caste', 'dalit', 'adivasi', 'tribal'],
  'literacy and education': ['school', 'student', 'teacher', 'education', 'literacy', 'exam'],
  'labour-wages-markets': ['wage', 'labour', 'worker', 'job', 'migrant', 'market', 'mgnrega'],
  'political economy': ['economy', 'gdp', 'inflation', 'market', 'fiscal'],
  '75 years of housing+water': ['housing', 'water', 'hand-pump', 'tap', 'drinking water', 'shelter'],
  'food insecurity': ['hunger', 'ration', 'pds', 'malnutrition', 'food security'],
  'rural reporting': ['village', 'rural', 'field', 'ground', 'hinterland', 'belt'],
  'infrastructure': ['road', 'bridge', 'electricity', 'pipeline', 'construction', 'infrastructure'],
  'access to public health': ['hospital', 'health', 'chc', 'phc', 'doctor', 'oxygen', 'clinic', 'patient'],
  'disease burden': ['disease', 'kala azar', 'malaria', 'tb', 'covid', 'outbreak', 'epidemic', 'death'],
  'governance': ['governance', 'official', 'department', 'administration', 'accountability', 'showcause'],
  'intersectional': ['gender', 'caste', 'class', 'intersection', 'women'],
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    const hay = String(text || '').toLowerCase()
    if (!hay.trim()) return NextResponse.json({ suggestions: [] })
    const scored = Object.entries(TAGS)
      .map(([tag, kws]) => [tag, kws.reduce((n, k) => n + (hay.includes(k) ? 1 : 0), 0)] as const)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag)
    return NextResponse.json({ suggestions: scored })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
