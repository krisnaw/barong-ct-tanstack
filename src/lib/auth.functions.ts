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

/** Admin or staff — for pickup desk and other ops tools. */
export function hasStaffAccess(role: unknown) {
  if (typeof role !== 'string' || !role) return false
  const roles = role.split(',').map((part) => part.trim())
  return roles.includes('admin') || roles.includes('staff')
}

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders()
    return auth.api.getSession({ headers })
  },
)
