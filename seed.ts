import { getPayload } from 'payload'
import config from './src/payload.config'

async function seed() {
  const payload = await getPayload({ config })
  console.log('Syncing database schema...')

  console.log('Seeding Users...')
  // Create first admin user
  const author = await payload.create({
    collection: 'users',
    data: {
      email: 'admin@abhishekangad.com',
      password: 'password',
      name: 'Abhishek Angad',
      role: 'admin',
    },
  })

  console.log('Seeding Sample Story...')
  await payload.create({
    collection: 'stories',
    data: {
      headline: 'Welcome to Reporters Desk',
      slug: 'welcome-to-reporters-desk',
      strap: 'The next generation of investigative journalism starts here.',
      body: {
        root: {
          children: [
            {
              children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Welcome to the platform. Explore the editorial desks and live dispatches.', type: 'text', version: 1 }],
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
      section: 'investigative',
      author: [author.id],
      status: 'published',
      layout_type: 'template_1',
      editorialReview: {
        factChecked: true,
        legallyReviewed: true,
      },
    },
  })

  console.log('Seed Complete!')
  process.exit(0)
}

seed()
