import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
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
      admin: {
        hidden: true,
      },
    },
    {
      name: 'backupCodes',
      type: 'array',
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
