import type { CollectionConfig } from 'payload'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    useAsTitle: 'action',
    description: 'Audit log of all admin actions and workflow transitions.',
    group: 'System',
  },
  access: {
    // Admin-only read — the trail holds login-failure IPs and every workflow
    // transition; lower roles shouldn't see it. (Default read was any-auth.)
    read: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
    create: () => false, // Typically created by hooks, not manually
    update: () => false, // Immutable log
    delete: () => false,
  },
  fields: [
    {
      name: 'action',
      type: 'text',
      required: true,
      label: 'Action Taken',
    },
    {
      name: 'collectionName',
      type: 'text',
      label: 'Collection',
    },
    {
      name: 'documentId',
      type: 'text',
      label: 'Document ID',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Performed By',
    },
    {
      name: 'details',
      type: 'json',
      label: 'Action Details / Diff',
    },
  ],
}
