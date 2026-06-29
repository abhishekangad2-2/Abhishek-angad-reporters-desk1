import type { CollectionConfig } from 'payload'

export const InvestigateRequests: CollectionConfig = {
  slug: 'investigate-requests',
  admin: {
    useAsTitle: 'topic',
    group: 'Journalism Toolkit',
    defaultColumns: ['topic', 'section', 'status', 'email', 'createdAt'],
    listSearchableFields: ['topic', 'details', 'email'],
    description: 'Reader-submitted investigation tips and leads ("Investigate this" callout).',
  },
  access: {
    // Anyone can submit a tip. Submissions come through the /api/investigate
    // route (Local API, elevated access), but allowing public create also keeps
    // the REST endpoint consistent with the Newsletter pattern.
    create: () => true,
    // Tips can contain sensitive source info — reading/triage is staff-only.
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) =>
      Boolean(user && (user.role === 'admin' || user.role === 'editor')),
  },
  fields: [
    {
      name: 'topic',
      type: 'text',
      required: true,
      maxLength: 200,
      admin: {
        description: 'Short summary of what the reader wants investigated.',
      },
    },
    {
      name: 'details',
      type: 'textarea',
      required: true,
      maxLength: 5000,
      admin: {
        description: 'The lead — what they know, who is involved, why it matters.',
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Optional — for newsroom follow-up. May be blank for anonymous tips.',
      },
    },
    {
      name: 'section',
      type: 'select',
      label: 'Region / Desk',
      options: [
        { label: 'Accountability', value: 'accountability' },
        { label: 'Politics & Power', value: 'politics' },
        { label: 'Business & Money', value: 'business' },
        { label: 'Environment', value: 'environment' },
        { label: 'Local / Civic', value: 'local' },
        { label: 'Other / Unsure', value: 'other' },
      ],
      admin: {
        description: 'Which desk the tip is most relevant to (reader-selected).',
      },
    },
    {
      name: 'newsletterOptIn',
      type: 'checkbox',
      label: 'Newsletter opt-in',
      defaultValue: false,
      admin: {
        description: 'Reader asked to receive the newsletter when submitting the tip.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Triaged', value: 'triaged' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Declined', value: 'declined' },
      ],
      access: {
        // Editorial workflow field — readers never set this.
        create: () => false,
        update: ({ req: { user } }) => Boolean(user),
      },
      admin: {
        description: 'Triage status (staff only).',
      },
    },
    {
      name: 'source',
      type: 'text',
      label: 'Submission Source',
      admin: {
        description: 'Page path where the tip was submitted.',
        readOnly: true,
      },
    },
  ],
}
