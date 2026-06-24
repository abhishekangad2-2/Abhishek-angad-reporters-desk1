import type { CollectionConfig } from 'payload'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
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
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'INR',
    },
    {
      name: 'razorpayId',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
        { label: 'Pending', value: 'pending' },
      ],
    },
  ],
}
