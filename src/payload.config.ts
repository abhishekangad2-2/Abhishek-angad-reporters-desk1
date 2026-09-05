import { postgresAdapter } from '@payloadcms/db-postgres'
import { gcsStorage } from '@payloadcms/storage-gcs'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Users } from './collections/Users'
import { Stories } from './collections/Stories'
import { Sections } from './collections/Sections'
import { Issues } from './collections/Issues'
import { Media } from './collections/Media'
import { Podcasts } from './collections/Podcasts'
import { LiveDispatches } from './collections/LiveDispatches'
import { Archive } from './collections/Archive'
import { Polls } from './collections/Polls'
import { Subscriptions } from './collections/Subscriptions'
import { Transactions } from './collections/Transactions'
import { Newsletters } from './collections/Newsletters'
import { NewsletterSubscribers } from './collections/NewsletterSubscribers'
import { Payments } from './collections/Payments'
import { Supporters } from './collections/Supporters'
import { AuditLogs } from './collections/AuditLogs'
import { RTIRequests } from './collections/RTIRequests'
import { InvestigateRequests } from './collections/InvestigateRequests'
import { Comments } from './collections/Comments'
import { Integrations } from './globals/Integrations'
import { DesignStudio } from './globals/DesignStudio'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Explicit origin allowlist for CORS (cross-origin API reads) and CSRF (which
// Origins may drive authenticated, cookie-based admin/API writes). Previously
// unset, which left both to Payload defaults; pinning the known imprints + hosts
// makes the trust boundary explicit and drift-proof. Anything not listed here
// gets no Access-Control-Allow-Origin and is rejected on CSRF-protected writes.
const allowedOrigins = Array.from(
  new Set(
    [
      'https://reporters-desk.org',
      'https://www.reporters-desk.org',
      'https://thelongpress.org',
      'https://www.thelongpress.org',
      'https://reporters-desk.abhishekangad.com',
      'https://reportersdesk.abhishekangad.com',
      // Local dev origin (only when explicitly running against localhost).
      process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '',
      // Allow an env override to add the canonical site URL without a code edit.
      process.env.NEXT_PUBLIC_SITE_URL || '',
    ].filter(Boolean),
  ),
)

export default buildConfig({
  cors: allowedOrigins,
  csrf: allowedOrigins,
  // Admin panel mounted at /cms (branded), not the Payload default /admin.
  // Must stay in sync with the (payload)/cms route folder + middleware matcher.
  routes: {
    admin: '/cms',
  },
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' · ReportersDesk',
    },
    // Components use `/components/...` (leading slash = relative to baseDir).
    // Our source lives under src/, so baseDir must be this config's dir (src),
    // not the default process.cwd() (repo root) — otherwise generate:importmap
    // emits paths one level too shallow and drops entries.
    importMap: {
      baseDir: dirname,
    },
    components: {
      graphics: {
        Icon: '/components/admin/AdminBrand#AdminIcon',
        Logo: '/components/admin/AdminBrand#AdminLogo',
      },
      providers: ['/components/admin/AdminStyles#AdminStyles'],
      beforeDashboard: [
        '/components/admin/DashboardWelcome#DashboardWelcome',
      ],
      afterDashboard: ['/components/admin/DashboardCardHints#DashboardCardHints'],
    },
  },
  // Ordered so the nav groups read as a real newsroom taxonomy: the daily
  // editorial tools first (Newsroom), then accounts/audit (System),
  // reader-engagement tools (Engagement), money (Finance), and the reporter
  // toolkit last. Order within a group follows this array order too.
  collections: [
    // Editorial
    Stories, Sections, Issues, Archive,
    // Multimedia
    Media, Podcasts,
    // Tools
    LiveDispatches, Polls, Newsletters, NewsletterSubscribers,
    Subscriptions, Transactions, Payments, Supporters, RTIRequests, InvestigateRequests, Comments,
    // Admin
    Users, AuditLogs,
  ],
  globals: [DesignStudio, Integrations],
  plugins: [
    gcsStorage({
      collections: {
        // When MEDIA_CDN_BASE_URL is set, media is served as direct Cloud CDN
        // URLs (the LB + backend bucket in front of the GCS bucket). Unset →
        // default Payload-served URLs, so this is safe to ship before DNS/cert
        // are live; flipping the CDN on is just setting the env var + redeploy.
        media: process.env.MEDIA_CDN_BASE_URL
          ? {
              disablePayloadAccessControl: true,
              generateFileURL: ({ filename, prefix }: any) =>
                `${process.env.MEDIA_CDN_BASE_URL}/${prefix ? `${prefix}/` : ''}${filename}`,
            }
          : true,
      },
      bucket: process.env.GCS_BUCKET_NAME || 'reportersdesk-media',
      options: {
        projectId: process.env.GCS_PROJECT_ID,
      },
    }),
  ],
  editor: lexicalEditor({}),
  secret: (() => {
    if (process.env.PAYLOAD_SECRET) {
      return process.env.PAYLOAD_SECRET
    }
    // During `next build` (static page-data collection) the secret is neither
    // present nor needed — no server is handling requests. Allow a build-only
    // placeholder so the build can complete. This value is never used at
    // runtime: on a running server PAYLOAD_SECRET is set, and if it is somehow
    // missing we still fail hard below rather than signing sessions insecurely.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return 'build-time-placeholder-not-used-at-runtime'
    }
    throw new Error('PAYLOAD_SECRET environment variable is required. Generate via: openssl rand -base64 32')
  })(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || 'postgres://postgres:password@127.0.0.1:5432/reporters_desk',
    },
    // Drizzle "push" applies schema diffs directly to the connected DB. That is
    // fine for local dev, but production runs a hand-managed migration workflow
    // (see ops notes) — auto-push against prod risks unintended DDL / drift, so
    // it is disabled outside development.
    push: process.env.NODE_ENV !== 'production',
  }),
})
