// Self-service admin password reset.
// You type the new password into your own terminal; it is hashed locally with
// Payload's exact PBKDF2 params (sha256, 25000 iterations, 512-byte key, 32-byte
// salt) and written straight to the users row. The plaintext never leaves your
// machine. 2FA is left intact.
//
// Usage:
//   export DATABASE_URI="postgres://payload:<pass>@127.0.0.1:5434/payload"
//   node scripts/reset-admin-password.mjs [email]
//
// (Run the Cloud SQL proxy on :5434 first — see reset-admin-password.sh which
//  wires the proxy + DATABASE_URI for you.)

import crypto from 'node:crypto'
import readline from 'node:readline'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Client } = require('pg')

const EMAIL = process.argv[2] || 'abhishekangad2@gmail.com'
const DB = process.env.DATABASE_URI
if (!DB) {
  console.error('✗ DATABASE_URI is not set. See scripts/reset-admin-password.sh')
  process.exit(1)
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    process.stdout.write(question)
    // Mute echo so the password isn't shown on screen.
    rl._writeToOutput = () => {}
    rl.question('', (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

const p1 = await askHidden('New password (min 8 chars): ')
const p2 = await askHidden('Confirm new password:      ')

if (p1.length < 8) {
  console.error('✗ Password must be at least 8 characters.')
  process.exit(1)
}
if (p1 !== p2) {
  console.error('✗ Passwords do not match.')
  process.exit(1)
}

const salt = crypto.randomBytes(32).toString('hex')
const hash = crypto.pbkdf2Sync(p1, salt, 25000, 512, 'sha256').toString('hex')

const client = new Client({ connectionString: DB })
await client.connect()
const res = await client.query(
  `UPDATE users
     SET hash = $1, salt = $2, login_attempts = 0, lock_until = NULL, updated_at = NOW()
   WHERE email = $3
   RETURNING id, email`,
  [hash, salt, EMAIL],
)
await client.end()

if (res.rowCount === 1) {
  console.log(`✓ Password reset for ${res.rows[0].email} (id ${res.rows[0].id}).`)
  console.log('  2FA is unchanged — you will still need your authenticator code to log in.')
} else {
  console.error(`✗ No user found with email "${EMAIL}". Nothing changed.`)
  process.exit(1)
}
