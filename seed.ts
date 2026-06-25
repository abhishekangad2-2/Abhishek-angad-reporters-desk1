import { getPayload } from 'payload'
import config from './src/payload.config'

async function seed() {
  const payload = await getPayload({ config })
  console.log('Syncing database schema...')

  console.log('Database schema synced. No seed data loaded.')
  console.log('')
  console.log('To create your first admin user, start the CMS and use the dashboard login form.')
  console.log('The first user to complete email + password + 2FA enrollment will become the admin.')

  console.log('Seed Complete!')
  process.exit(0)
}

seed()
