import { postgresAdapter } from '@payloadcms/db-postgres'
import { gcsStorage } from '@payloadcms/storage-gcs'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Stories } from './collections/Stories'
import { Media } from './collections/Media'
import { LiveDispatches } from './collections/LiveDispatches'
import { Polls } from './collections/Polls'
import { Subscriptions } from './collections/Subscriptions'
import { Transactions } from './collections/Transactions'
import { Newsletters } from './collections/Newsletters'
import { NewsletterSubscribers } from './collections/NewsletterSubscribers'
import { Payments } from './collections/Payments'
import { AuditLogs } from './collections/AuditLogs'
import { RTIRequests } from './collections/RTIRequests'
import { Integrations } from './globals/Integrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [
    Users, Stories, Media, LiveDispatches, Polls,
    Subscriptions, Transactions, Newsletters, NewsletterSubscribers,
    Payments, AuditLogs, RTIRequests,
  ],
  globals: [Integrations],
  plugins: [
    gcsStorage({
      collections: {
        media: true,
      },
      bucket: process.env.GCS_BUCKET_NAME || 'reportersdesk-media',
      options: {
        projectId: process.env.GCS_PROJECT_ID,
      },
    }),
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'secret-key-reporters-desk',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || 'postgres://postgres:password@127.0.0.1:5432/reporters_desk',
    },
    push: true,
  }),
})
