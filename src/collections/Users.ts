import type { CollectionConfig } from 'payload'

const isAdmin: NonNullable<CollectionConfig['access']>['read'] = ({ req: { user } }) =>
  Boolean(user && (user as { role?: string }).role === 'admin')

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'System',
    description: 'Newsroom staff accounts, roles, and 2FA status.',
  },
  access: {
    // A user may read/update their own record; admins manage everyone. Without
    // this, Payload's default (any authenticated user) let any logged-in
    // account read every other user's row via /api/users.
    read: ({ req: { user } }) => {
      if (!user) return false
      if ((user as { role?: string }).role === 'admin') return true
      return { id: { equals: user.id } }
    },
    create: isAdmin,
    update: ({ req: { user } }) => {
      if (!user) return false
      if ((user as { role?: string }).role === 'admin') return true
      return { id: { equals: user.id } }
    },
    delete: isAdmin,
  },
  auth: {
    // Payload uses Argon2id out of the box for password hashing.
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes
    // Use stateless JWTs (no server-side session records). Our custom 2FA
    // flow (api/auth/verify-2fa) mints the Payload auth token itself after
    // the second factor succeeds; a stateless token can be issued without
    // replicating Payload's internal addSessionToUser() session bookkeeping.
    useSessions: false,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'reporter',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Reporter', value: 'reporter' },
        { label: 'Contributor', value: 'contributor' },
      ],
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'totpSecret',
      type: 'text',
      // Never exposed over any API surface — the 2FA flow reads it via the
      // Local API, which bypasses access control. hidden:true only hid it in
      // the admin UI, not the REST/GraphQL response.
      access: {
        read: () => false,
        create: () => false,
        update: () => false,
      },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'backupCodes',
      type: 'array',
      access: {
        read: () => false,
        create: () => false,
        update: () => false,
      },
      admin: {
        hidden: true,
      },
      fields: [
        {
          name: 'codeHash',
          type: 'text',
        },
        {
          name: 'usedAt',
          type: 'date',
          admin: {
            hidden: true,
          },
        },
      ],
    },
    {
      name: 'twoFactorEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        hidden: true,
      },
    },
  ],
}
