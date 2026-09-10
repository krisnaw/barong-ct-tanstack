import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '~/lib/auth'

export function hasAdminRole(role: unknown) {
  if (typeof role !== 'string' || !role) return false
  return role
    .split(',')
    .map((part) => part.trim())
    .includes('admin')
}

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    return auth.api.getSession({ headers })
  },
)
