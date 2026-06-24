import { getPayload } from 'payload'
import config from './src/payload.config'

async function seed() {
  const payload = await getPayload({ config })
  console.log('Syncing database schema...')

  console.log('Seeding Sections...')
  const investigatory = await payload.create({
    collection: 'sections',
    data: {
      name: 'Investigatory',
      slug: 'investigatory',
      description: 'Long-form deep dives into systemic corruption and public interest stories.',
    },
  })

  console.log('Seeding Users...')
  const author = await payload.create({
    collection: 'users',
    data: {
      email: 'admin@abhishekangad.com',
      password: 'password',
      name: 'Abhishek Angad',
      role: 'admin',
    },
  })

  console.log('Seeding Story...')
  await payload.create({
    collection: 'stories',
    data: {
      headline: 'Welcome to Reporters Desk',
      slug: 'welcome',
      strap: 'The next generation of investigative journalism starts here.',
      body: {
        root: {
          children: [
            {
              children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Welcome to the platform.', type: 'text', version: 1 }],
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
      section: investigatory.id,
      author: [author.id],
      status: 'published',
      layout_type: 'template_1',
    },
  })

  console.log('Seed Complete!')
  process.exit(0)
}

seed()
