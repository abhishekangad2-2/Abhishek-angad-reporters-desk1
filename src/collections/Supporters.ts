import type { CollectionConfig } from 'payload'
import { isEditorOrAbove, isAdmin } from '../lib/access'

// Self-reported UPI supporters: after scanning the QR, the payer confirms with
// their email + UPI reference so the newsroom has a record and can send a
// receipt. Created only via /api/support/record (overrideAccess); staff read.
export const Supporters: CollectionConfig = {
  slug: 'supporters',
  labels: { singular: 'Supporter', plural: 'Supporters' },
  access: {
    read: isEditorOrAbove,
    create: () => false, // only via the record endpoint
    update: isEditorOrAbove,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'email',
    group: 'Tools',
    defaultColumns: ['referenceId', 'name', 'email', 'amount', 'tier', 'status', 'createdAt'],
    listSearchableFields: ['referenceId', 'name', 'email', 'upiReference'],
    description: 'People who contributed via UPI (self-reported at /support). Match upiReference against your Kotak statement, then mark Confirmed.',
  },
  fields: [
    { name: 'referenceId', type: 'text', admin: { readOnly: true, description: 'RD-###### — sent to the supporter.' } },
    { name: 'name', type: 'text' },
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'amount', type: 'number', admin: { description: 'Rupees.' } },
    {
      name: 'tier',
      type: 'select',
      options: [
        { label: 'Member (₹5,000/yr)', value: 'reader' },
        { label: 'Patron (₹10,000/yr)', value: 'foi' },
        { label: 'Coffee (one-time)', value: 'coffee' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'reader',
    },
    { name: 'upiReference', type: 'text', admin: { description: 'UPI/UTR reference the payer entered.' } },
    { name: 'newsletterOptIn', type: 'checkbox', defaultValue: true, admin: { description: 'Also added to the newsletter.' } },
    { name: 'isGift', type: 'checkbox', defaultValue: false, admin: { description: 'Bought as a gift for someone else.' } },
    { name: 'giftRecipientEmail', type: 'email', admin: { description: 'Who the gift membership is for.' } },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending (unverified)', value: 'pending' },
        { label: 'Confirmed (matched to bank)', value: 'confirmed' },
      ],
      defaultValue: 'pending',
      admin: { description: 'Self-reported until you match it to your Kotak statement.' },
    },
  ],
}
