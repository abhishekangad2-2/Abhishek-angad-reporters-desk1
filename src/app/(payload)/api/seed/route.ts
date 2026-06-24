import { getPayload } from 'payload'
import configPromise from '../../../../payload.config'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    const sections = [
      'Accountability Journalism',
      'Ground Reportage',
      'Data Journalism',
      'Investigative Journalism',
      'Analysis',
      'Behind the Process',
      'Visual and Audio Investigations',
      'Policy and People',
    ]

    const createdSections = []
    for (const section of sections) {
      const slug = section.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      try {
        const existing = await payload.find({
          collection: 'sections',
          where: { slug: { equals: slug } },
        })
        if (existing.totalDocs === 0) {
          await payload.create({
            collection: 'sections',
            data: {
              title: section,
              slug,
            },
          })
          createdSections.push(section)
        }
      } catch (e) {
        console.error(e)
      }
    }

    const issuesMap = {
      governance_money: [
        'follow the money',
        'where was your money spent',
        'governance',
        'policy implementation',
        'legislature and laws',
        'political economy',
      ],
      politics_power: [
        'politics and politicians',
        'geo-politics',
        'national politics',
        'state politics',
        'local-level politics',
      ],
      justice_rights: ['criminal justice system', 'the minority question', 'intersectional'],
      environment_resources: [
        'climate change',
        'renewables',
        '75 years of housing+water',
        'infrastructure',
      ],
      land_food: [
        'food and farmers and politics',
        'food insecurity',
        'rural reporting',
        'urban and rural',
        'labour-wages-markets',
      ],
      health_education: ['access to public health', 'disease burden', 'literacy and education'],
      economy_enterprise: ['entrepreneurs', 'businesses'],
      ideas_culture: ['reading through and in between', 'good books&good books'],
      formats: ['Q&A!', 'podcast (audio)', 'podcasts(video)'],
    }

    const createdIssues = []
    for (const [cluster, titles] of Object.entries(issuesMap)) {
      for (const title of titles) {
        try {
          const existing = await payload.find({
            collection: 'issues',
            where: { title: { equals: title } },
          })
          if (existing.totalDocs === 0) {
            await payload.create({
              collection: 'issues',
              data: {
                title,
                cluster: cluster as any,
              },
            })
            createdIssues.push(title)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Seeding complete',
      createdSections,
      createdIssues,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
