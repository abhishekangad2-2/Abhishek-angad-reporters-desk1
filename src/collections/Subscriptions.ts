import type { CollectionConfig } from 'payload'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'subscriberEmail',
    group: 'Admin Console',
  },
  access: {
    create: () => false,
    update: () => false,
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    // Razorpay's subscription id — the idempotency key the webhook upserts on.
    {
      name: 'razorpaySubscriptionId',
      type: 'text',
      index: true,
      unique: true,
    },
    {
      name: 'subscriberEmail',
      type: 'email',
    },
    {
      // Optional: a registered CMS user, if the subscriber maps to one. Most
      // readers won't, so this is not required — subscriberEmail is the anchor.
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
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
      // Mirrors the Razorpay subscription lifecycle so the console reflects the
      // real upstream state rather than a lossy projection.
      name: 'status',
      type: 'select',
      options: [
        { label: 'Created', value: 'created' },
        { label: 'Authenticated', value: 'authenticated' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Completed', value: 'completed' },
        { label: 'Expired', value: 'expired' },
      ],
      defaultValue: 'created',
      required: true,
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
    },
  ],
}
