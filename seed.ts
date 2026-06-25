import { getPayload } from 'payload'
import config from './src/payload.config'

async function seed() {
  const payload = await getPayload({ config })
  console.log('Syncing database schema...')

  console.log('Seeding Sections...')
  const sections = await Promise.all([
    payload.create({
      collection: 'sections',
      data: {
        name: 'Accountability Journalism',
        slug: 'accountability',
        description: 'Holding power to account through investigative reporting and data analysis',
        defaultAccent: 'house-red',
        defaultLayout: 'template_3',
      },
    }),
    payload.create({
      collection: 'sections',
      data: {
        name: 'Ground Reportage',
        slug: 'ground-reportage',
        description: 'On-the-ground reporting from underreported regions and communities',
        defaultAccent: 'field-teal',
        defaultLayout: 'template_2',
      },
    }),
    payload.create({
      collection: 'sections',
      data: {
        name: 'Data Journalism',
        slug: 'data-journalism',
        description: 'Investigative stories driven by data analysis and visualization',
        defaultAccent: 'slate',
        defaultLayout: 'template_3',
      },
    }),
    payload.create({
      collection: 'sections',
      data: {
        name: 'Investigative Journalism',
        slug: 'investigative',
        description: 'Deep dives into systemic issues and institutional failures',
        defaultAccent: 'house-red',
        defaultLayout: 'template_1',
      },
    }),
    payload.create({
      collection: 'sections',
      data: {
        name: 'Analysis',
        slug: 'analysis',
        description: 'Expert perspective on current events and long-term trends',
        defaultAccent: 'slate',
        defaultLayout: 'template_2',
      },
    }),
    payload.create({
      collection: 'sections',
      data: {
        name: 'Behind the Process',
        slug: 'behind-the-process',
        description: 'How we do our work: methodology, data sources, and editorial decisions',
        defaultAccent: 'ink',
        defaultLayout: 'template_2',
      },
    }),
    payload.create({
      collection: 'sections',
      data: {
        name: 'Visual and Audio Investigations',
        slug: 'visual-audio',
        description: 'Stories told through photography, video, and sound',
        defaultAccent: 'field-teal',
        defaultLayout: 'template_4',
      },
    }),
    payload.create({
      collection: 'sections',
      data: {
        name: 'Policy and People',
        slug: 'policy-people',
        description: 'How policy decisions impact lives on the ground',
        defaultAccent: 'forest',
        defaultLayout: 'template_3',
      },
    }),
  ])

  console.log('Seeding Issues...')
  await Promise.all([
    // Environment
    payload.create({
      collection: 'issues',
      data: { title: 'Climate Change', cluster: 'Environment' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Water Rights and Scarcity', cluster: 'Environment' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Food and Farming', cluster: 'Environment' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Mining and Natural Resources', cluster: 'Environment' },
    }),
    // Justice
    payload.create({
      collection: 'issues',
      data: { title: 'Criminal Justice System', cluster: 'Justice' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Police Accountability', cluster: 'Justice' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Human Rights', cluster: 'Justice' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Caste and Discrimination', cluster: 'Justice' },
    }),
    // Economy & Inequality
    payload.create({
      collection: 'issues',
      data: { title: 'Labor and Working Rights', cluster: 'Economy' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Wage and Market Economics', cluster: 'Economy' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Follow the Money', cluster: 'Economy' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Land Rights and Housing', cluster: 'Economy' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: '75 Years of Housing and Water', cluster: 'Economy' },
    }),
    // Governance & Rights
    payload.create({
      collection: 'issues',
      data: { title: 'The Minority Question', cluster: 'Governance' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Electoral Politics', cluster: 'Governance' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Religious Freedom', cluster: 'Governance' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Women\'s Rights', cluster: 'Governance' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'LGBTQ+ Rights', cluster: 'Governance' },
    }),
    // Health & Development
    payload.create({
      collection: 'issues',
      data: { title: 'Public Health', cluster: 'Health' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Healthcare Access', cluster: 'Health' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Education', cluster: 'Health' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Child Welfare', cluster: 'Health' },
    }),
    // Geopolitics
    payload.create({
      collection: 'issues',
      data: { title: 'Geopolitics and Borders', cluster: 'Geopolitics' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'International Relations', cluster: 'Geopolitics' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Conflict and War', cluster: 'Geopolitics' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Refugees and Migration', cluster: 'Geopolitics' },
    }),
    // Media & Civic Participation
    payload.create({
      collection: 'issues',
      data: { title: 'Media Freedom', cluster: 'Civil Society' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Right to Information', cluster: 'Civil Society' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Digital Rights and Privacy', cluster: 'Civil Society' },
    }),
    payload.create({
      collection: 'issues',
      data: { title: 'Civic Participation', cluster: 'Civil Society' },
    }),
  ])

  console.log('Sections and Issues seeded.')
  console.log('')
  console.log('To create your first admin user, start the CMS and use the dashboard login form.')
  console.log('The first user to complete email + password + 2FA enrollment will become the admin.')

  console.log('Seed Complete!')
  process.exit(0)
}

seed()
