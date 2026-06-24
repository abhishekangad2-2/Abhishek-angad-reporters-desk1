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
          name: 'code',
          type: 'text',
        },
      ],
    },
  ],
}
