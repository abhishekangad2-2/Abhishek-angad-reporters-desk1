import { getPayload } from 'payload'
import config from './src/payload.config'

async function seedStories() {
  const payload = await getPayload({ config })

  console.log('Fetching Sections and Issues...')
  const sections = await payload.find({ collection: 'sections', limit: 100 })
  const issues = await payload.find({ collection: 'issues', limit: 100 })

  const sectionMap = Object.fromEntries(sections.docs.map(s => [s.slug, s.id]))
  const issueMap = Object.fromEntries(issues.docs.map(i => [i.title, i.id]))

  console.log('Creating stories...')

  const stories = [
    {
      section: 'accountability',
      headline: 'Inside the Digital Surveillance State: How Tech Giants Track Your Every Move',
      strap: 'A detailed investigation into data collection practices by major technology companies',
      slug: 'digital-surveillance-tech-giants',
      issues: ['Follow the Money', 'Digital Rights and Privacy'],
      accentTheme: 'inherit',
      status: 'published',
    },
    {
      section: 'investigative',
      headline: 'The Coal Lobby\'s Secret Campaign Against Climate Policy',
      strap: 'Documents reveal coordinated effort to block renewable energy legislation',
      slug: 'coal-lobby-climate-fight',
      issues: ['Climate Change', 'Follow the Money'],
      accentTheme: 'house-red',
      status: 'published',
    },
    {
      section: 'ground-reportage',
      headline: 'Kashmir Villages Struggle with Water Shortage as Glaciers Melt',
      strap: 'Climate change is reshaping life in the Himalayas—and local communities are paying the price',
      slug: 'kashmir-water-crisis',
      issues: ['Water Rights and Scarcity', 'The Minority Question'],
      accentTheme: 'field-teal',
      status: 'published',
    },
    {
      section: 'data-journalism',
      headline: 'Mapping Police Violence: A State-by-State Analysis of Force Statistics',
      strap: 'Analysis of 5 years of law enforcement data reveals troubling patterns',
      slug: 'police-violence-data-analysis',
      issues: ['Police Accountability', 'Criminal Justice System'],
      accentTheme: 'slate',
      status: 'published',
    },
    {
      section: 'analysis',
      headline: 'Why Land Redistribution Remains India\'s Most Contentious Issue',
      strap: 'Historical context and current debate on agrarian reform and land rights',
      slug: 'land-redistribution-analysis',
      issues: ['Land Rights and Housing', '75 Years of Housing and Water'],
      accentTheme: 'inherit',
      status: 'published',
    },
    {
      section: 'behind-the-process',
      headline: 'How We Verified Claims About Election Fund Flows',
      strap: 'Methodology and findings from our investigation into campaign financing',
      slug: 'election-funds-methodology',
      issues: ['Electoral Politics', 'Follow the Money'],
      accentTheme: 'ink',
      status: 'published',
    },
    {
      section: 'visual-audio',
      headline: 'Audio Dispatch: Voices from the India-Bangladesh Border',
      strap: 'A podcast series documenting lives of people living along contested boundaries',
      slug: 'india-bangladesh-border-podcast',
      issues: ['Geopolitics and Borders', 'Refugees and Migration'],
      accentTheme: 'inherit',
      status: 'published',
    },
    {
      section: 'policy-people',
      headline: 'How Minimum Wage Hikes Affect Small Business Owners in Rural Areas',
      strap: 'Policy analysis meets human stories in this investigation of wage legislation impacts',
      slug: 'minimum-wage-rural-impact',
      issues: ['Labor and Working Rights', 'Wage and Market Economics'],
      accentTheme: 'forest',
      status: 'published',
    },
    // Additional stories for richness
    {
      section: 'accountability',
      headline: 'RTI Requests Reveal Hospital Corruption in Three States',
      strap: 'Right to Information filings uncover systematic misuse of funds',
      slug: 'rti-hospital-corruption',
      issues: ['Corruption', 'Public Health'],
      accentTheme: 'inherit',
      status: 'published',
    },
    {
      section: 'investigative',
      headline: 'The Trafficking Network: How Children Are Moved Across Borders',
      strap: 'A six-month investigation tracks organized crime networks targeting vulnerable youth',
      slug: 'child-trafficking-investigation',
      issues: ['Human Rights', 'Child Welfare'],
      accentTheme: 'house-red',
      status: 'draft',
    },
  ]

  for (const story of stories) {
    try {
      const sectionId = sectionMap[story.section]
      const issueIds = story.issues
        .map(issue => issueMap[issue])
        .filter(id => id !== undefined)

      if (!sectionId) {
        console.warn(`  ⚠️  Section "${story.section}" not found, skipping story`)
        continue
      }

      await payload.create({
        collection: 'stories',
        data: {
          headline: story.headline,
          strap: story.strap,
          slug: story.slug,
          section: sectionId,
          issueTags: issueIds,
          accentTheme: story.accentTheme,
          status: story.status,
          author: [],
          body: {
            root: {
              children: [
                {
                  children: [{
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: `${story.strap}. This is a sample story created during testing.`,
                    type: 'text',
                    version: 1
                  }],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          },
          layout_type: 'template_1',
          editorialReview: {
            factChecked: story.status === 'published',
            legallyReviewed: story.status === 'published',
          },
        },
      })

      console.log(`  ✅ Created: "${story.headline}"`)
    } catch (err: any) {
      console.error(`  ❌ Failed to create story: ${err.message}`)
    }
  }

  console.log('\n✅ Stories seeded!')
  process.exit(0)
}

seedStories().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
