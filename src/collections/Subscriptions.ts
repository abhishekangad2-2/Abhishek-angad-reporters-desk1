import type { CollectionConfig } from 'payload'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'id',
    group: 'Admin Console',
    defaultColumns: ['user', 'plan', 'status', 'expiresAt'],
    listSearchableFields: ['plan', 'status'],
    description: 'Active subscriptions. Filter by plan or status for a quick subscriber dashboard.',
  },
  access: {
    create: () => false,
    update: () => false,
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'plan',
      type: 'select',
      options: [
        { label: 'FOI Patron', value: 'foi_patron' },
        { label: 'Reader', value: 'reader' },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Expired', value: 'expired' },
      ],
      defaultValue: 'active',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
    },
  ],
}
