import type { CollectionConfig } from 'payload'

// Subscriber ledger. Rows are created/updated exclusively by the Razorpay
// webhook (src/app/api/webhooks/razorpay/route.ts) via the Payload Local API,
// which bypasses access control. Public REST create/update is therefore blocked
// so a forged request cannot mint or mutate a subscription. Read is admin/editor
// only — this holds subscriber PII (email).
export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'subscriberEmail',
    group: 'Finance',
    defaultColumns: ['subscriberEmail', 'plan', 'status', 'currentPeriodEnd'],
    listSearchableFields: ['subscriberEmail', 'plan', 'status', 'razorpaySubscriptionId'],
    description: 'Active subscriptions. Filter by plan or status for a quick subscriber dashboard.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && (user.role === 'admin' || user.role === 'editor')),
    create: () => false, // Webhook writes via Local API (bypasses access)
    update: () => false, // Webhook writes via Local API (bypasses access)
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'razorpaySubscriptionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Razorpay Subscription ID',
    },
    {
      name: 'subscriberEmail',
      type: 'text',
      label: 'Subscriber Email',
    },
    {
      // Optional link to a Payload user, if the subscriber also has an account.
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'plan',
      type: 'select',
      required: true,
      options: [
        { label: 'FOI Patron', value: 'foi-patron' },
        { label: 'Reader', value: 'reader' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'created',
      // Mirrors Razorpay subscription lifecycle states (mapped in the webhook).
      options: [
        { label: 'Created', value: 'created' },
        { label: 'Authenticated', value: 'authenticated' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    {
      name: 'mandateType',
      type: 'select',
      options: [{ label: 'UPI Autopay', value: 'upi-autopay' }],
      defaultValue: 'upi-autopay',
    },
    {
      name: 'currentPeriodEnd',
      type: 'date',
      label: 'Current Period End',
    },
  ],
}
