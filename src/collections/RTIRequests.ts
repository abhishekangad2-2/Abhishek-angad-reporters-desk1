import type { CollectionConfig } from 'payload'

export const RTIRequests: CollectionConfig = {
  slug: 'rti-requests',
  admin: {
    useAsTitle: 'topic',
    group: 'Journalism Toolkit',
    description: 'Internal tracker for Freedom of Information (FOI) and Right to Information (RTI) requests.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin' || user.role === 'editor'
    },
  },
  fields: [
    {
      name: 'topic',
      type: 'text',
      required: true,
    },
    {
      name: 'department',
      type: 'text',
      required: true,
      admin: {
        description: 'Which government department or agency is this filed with?',
      },
    },
    {
      name: 'dateFiled',
      type: 'date',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'filed',
      options: [
        { label: 'Filed', value: 'filed' },
        { label: 'Acknowledged', value: 'acknowledged' },
        { label: 'Pending Response', value: 'pending' },
        { label: 'Data Received', value: 'received' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'In Appeal', value: 'appeal' },
      ],
    },
    {
      name: 'dueDate',
      type: 'date',
      admin: {
        description: 'Legal deadline for the agency to respond.',
      },
    },
    {
      name: 'appealNotes',
      type: 'textarea',
      admin: {
        condition: (data) => data.status === 'appeal' || data.status === 'rejected',
      },
    },
    {
      name: 'assignedReporter',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
    },
  ],
}
