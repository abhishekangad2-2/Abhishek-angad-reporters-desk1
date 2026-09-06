// Plain-SQL forward-only migration runner for the production Postgres.
//
// Why this exists: the Payload postgres adapter runs `push: true` in dev only —
// in production (NODE_ENV=production) Payload skips schema sync entirely, so a
// new collection / field / enum value ships in code with no matching schema and
// the admin 500s. This runner applies hand-written, idempotent SQL migrations
// against prod, tracked in a `_schema_migrations` table, using nothing but `pg`
// (no Payload/Next import, so none of the ESM-CLI breakage applies).
//
// Usage (DATABASE_URI must point at the target DB — see scripts/migrate-prod.sh):
//   node scripts/migrate.mjs            # apply all pending
//   node scripts/migrate.mjs --status   # list applied/pending, apply nothing
//
// Adding a migration: drop a NNNN_description.sql file in migrations-sql/. Keep
// each file idempotent (IF NOT EXISTS / ADD VALUE IF NOT EXISTS) so re-running
// against an already-migrated prod is a safe no-op. Enum ADD VALUE and any use
// of that new value must live in SEPARATE files (Postgres refuses to use an
// enum value added in the same transaction).

import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Client } = require('pg')

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations-sql')
const STATUS_ONLY = process.argv.includes('--status')

const DB = process.env.DATABASE_URI
if (!DB) {
  console.error('✗ DATABASE_URI is not set. Use scripts/migrate-prod.sh, or export it yourself.')
  process.exit(1)
}

const client = new Client({ connectionString: DB })
await client.connect()

await client.query(
  'CREATE TABLE IF NOT EXISTS _schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
)

const files = (await readdir(DIR).catch(() => []))
  .filter((f) => f.endsWith('.sql'))
  .sort()
const applied = new Set(
  (await client.query('SELECT name FROM _schema_migrations')).rows.map((r) => r.name),
)
const pending = files.filter((f) => !applied.has(f))

if (STATUS_ONLY) {
  console.log(`applied (${applied.size}):`, [...applied].sort().join(', ') || '(none)')
  console.log(`pending (${pending.length}):`, pending.join(', ') || '(none)')
  await client.end()
  process.exit(0)
}

if (pending.length === 0) {
  console.log('✓ schema up to date — no pending migrations')
  await client.end()
  process.exit(0)
}

for (const file of pending) {
  const sql = await readFile(join(DIR, file), 'utf8')
  process.stdout.write(`→ applying ${file} ... `)
  try {
    await client.query(sql)
    await client.query('INSERT INTO _schema_migrations (name) VALUES ($1)', [file])
    console.log('ok')
  } catch (err) {
    console.log('FAILED')
    console.error(`✗ ${file}: ${err.message}`)
    await client.end()
    process.exit(1)
  }
}

console.log(`✓ applied ${pending.length} migration(s)`)
await client.end()
