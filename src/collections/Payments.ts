import type { CollectionConfig } from 'payload'

export const Payments: CollectionConfig = {
  slug: 'payments',
  admin: {
    useAsTitle: 'razorpayPaymentId',
    group: 'Admin Console',
    defaultColumns: ['razorpayPaymentId', 'status', 'amount', 'createdAt'],
    listSearchableFields: ['razorpayPaymentId', 'status'],
    description: 'Individual payment transactions recorded from Razorpay webhooks.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'editor')),
    create: () => false, // Webhook writes via Local API (bypasses access); block forged public REST creates
    update: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
  },
  fields: [
    {
      name: 'razorpayPaymentId',
      type: 'text',
      required: true,
      unique: true,
      label: 'Razorpay Payment ID',
    },
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      label: 'Associated Subscription',
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'Amount (INR)',
      admin: {
        description: 'Amount in INR (already converted from Razorpay paise).',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Captured', value: 'captured' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      name: 'paidAt',
      type: 'date',
    },
  ],
}
