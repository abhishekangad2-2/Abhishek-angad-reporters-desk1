// Shared role helpers + Payload access functions for the editorial roles
// matrix (Admin / Editor / Reporter / Contributor). Used by collections to
// enforce the workflow without scattering role checks across files.

import type { Access, PayloadRequest } from 'payload'

export type Role = 'admin' | 'editor' | 'reporter' | 'contributor'

export function roleOf(req: PayloadRequest): Role | null {
  return ((req.user as any)?.role as Role) ?? null
}

export const isAdmin: Access = ({ req }) => roleOf(req) === 'admin'

export const isEditorOrAbove: Access = ({ req }) => {
  const r = roleOf(req)
  return r === 'admin' || r === 'editor'
}

export const isReporterOrAbove: Access = ({ req }) => {
  const r = roleOf(req)
  return r === 'admin' || r === 'editor' || r === 'reporter'
}

export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

export const publicRead: Access = () => true
